import cheerio from 'cheerio'
import { fchownSync, fstat, writeFileSync } from 'fs'
import _ from 'lodash'
import request from 'request'
import RequestPromise from 'request-promise-native'
import Url from 'url'
import { IAmazonObject } from './interfaces/amazon'

enum ERROR_TYPE {
  REQUEST_FAILED = 'REQUEST_FAILED',
  NO_INVENTORY = 'NO_INVENTORY',
  INCORRECT_INVENTORY = 'NO_INVENTORY',
  LIMIT_INVENTORY = 'LIMIT_INVENTORY',
  NO_HTML_BODY = 'NO_HTML_BODY',
  CONFIRMATION_ERROR = 'CONFIRMATION_ERROR',
  NO_AMAZON_FORM = 'NO_AMAZON_FORM',
}

interface IAmazonForm {
  formUrl: string
  formData: object
}

interface IRequestObject {
  url: string
  method: string
  formData?: object
}

interface IAdditionalInformations {
  createdOn: string
  salesRank: object[]
  ratings: object
  categories: string[]
}

class AmazonScraper {
  private cookieJar: any
  private productUrl: string

  private readonly titleSelector: string = 'h1#title'
  private readonly merchantIdSelector: string = '#merchantID'
  private readonly merchantNameSelector: string = '#sellerProfileTriggerId:first'
  private readonly addToCardBtnSelectors: string[] = ['#addToCart', '#handleBuy']
  private readonly priceSelectors: string[] = [
    '#priceblock_ourprice',
    '#priceblock_saleprice',
    '#priceBlock .priceLarge',
    '#actualPriceContent .priceLarge',
    '#actualPriceValue .priceLarge',
    '.a-price',
  ]
  private readonly salesRankSelector = '.zg_hrsr_item .zg_hrsr_rank'
  private readonly categorySelector = '#SalesRank a'
  private readonly alertBoxSelector = '#huc-v2-box-warning'
  private readonly confirmTextSelector = '#confirm-text'
  private readonly remainingInventorySelector = '#hucArgsNewItems'
  private readonly isAvailableSelector: string[] = ['#outOfStock', '#availability', '.availRed']
  private readonly defaultQuantity: number = 999

  constructor (productUrl: string) {
    this.cookieJar = request.jar()
    this.productUrl = productUrl
  }

  /**
   * Access a WebPage
   *
   * ### Example (es module)
   * ```js
   * import AmazonScraper  from 'typescript-starter'
   * new AmazonScraper().accessPage('http://test.com')
   * // => Returns a Cheerio selector ($(YOURELEMENT))
   * ```
   *
   * @param url   The Url to access.
   * @returns       A Cheerio Selector.
   */
  public async accessPage (object: IRequestObject): Promise<any> {
    try {
      const $: any = await RequestPromise({
        uri: object.url,
        form: object.formData,
        jar: this.cookieJar,
        method: object.method,
        followAllRedirects: true,
        resolveWithFullResponse: true,
        transform (body: any) {
          return cheerio.load(body)
        },
      })

      return $
    } catch (error) {
      throw new Error(error)
    }
  }

  /**
   * Return a Product's Information
   *
   * @param {any} $
   * @returns {Promise<IAmazonObject>}
   * @memberof AmazonScraper
   */
  public async processProductPage ($: any): Promise<IAmazonObject> {
    const title = this.scrapeProductTitle($)
    const price = this.scrapeProductPrice($)
    const merchantId = this.scrapeMerchantId($)
    const additionalInfo = this.scrapeAdditionalInfo($)
    const merchantName = this.scrapeMerchantName($)
    const isAvailable = this.scrapeProductAvailability($)
    const asin = this.scrapeProductAsin($)

    const productObject: IAmazonObject = {
      asin,
      categories: additionalInfo.categories,
      salesRank: additionalInfo.salesRank,
      ratings: additionalInfo.ratings,
      createdOn: additionalInfo.createdOn,
      isAvailable,
      merchantId,
      merchantName,
      price,
      productUrl: this.productUrl,
      title,
    }

    return productObject
  }

  /**
   * Scrape the Checkout Page and return the Inventory
   *
   * @param {any} $
   * @param {string} asin
   * @returns {number}
   * @memberof AmazonScraper
   */
  public processCheckoutPage ($: any, asin: string): number {
    const htmlBody = $('body').html()

    if (!htmlBody) {
      throw new Error(ERROR_TYPE.NO_HTML_BODY)
    }

    if (
      htmlBody &&
      htmlBody.match(
        /(Veuillez confirmer que|Confirma que quieres|Please confirm|faut que nous nous assurions que vous)/g,
      )
    ) {
      throw new Error(ERROR_TYPE.CONFIRMATION_ERROR)
    } else if (htmlBody && htmlBody.match(/(Votre mise à jour a)/g)) {
      throw new Error(ERROR_TYPE.REQUEST_FAILED)
    }

    // Checking if the inventory is present on the page
    // If not it means we cannot know the exact value
    let inventoryText: string | undefined
    const alertBox = $(this.alertBoxSelector)
    const confirmText = $(this.confirmTextSelector)

    // Checking the inventory available or if there is a limit per product
    if (alertBox.length > 0) {
      const match = htmlBody.match(/(?:de los|a que|than the) ([0-9]+) (?:disponibles|de disponible|available)/)
      const match2 = htmlBody.match(/(?:limite de vente de|limit of) ([0-9]+) (?:articles|per customer)/)

      if (match) {
        inventoryText = match[1]
      } else if (match2) {
        throw new Error(ERROR_TYPE.LIMIT_INVENTORY)
      }
    } else if (confirmText.length > 0) {
      inventoryText = confirmText.text().trim()
    } else {
      const match = htmlBody.match(/\((([^)]+ (articles|article|producto|productos|items|item)))\)/g)
      if (match) {
        inventoryText = match[0]
      }
    }

    if (!inventoryText) {
      throw new Error(ERROR_TYPE.NO_INVENTORY)
    }

    // const remainingInvDiv = $(`div[data-asin="${asin}"]`);
    // tslint:disable-next-line:no-console
    // console.log(remainingInvDiv)
    const inventoryNumber: number = Number(inventoryText)

    const hiddenInventoryConfirmation = Number($(inventoryText).val().split(',')[1])

    if (hiddenInventoryConfirmation !== inventoryNumber) {
      throw new Error(ERROR_TYPE.INCORRECT_INVENTORY)
    }

    return inventoryNumber
  }

  public processCartPage ($: any, asin: string): number {
    const remainingInventory = $(`input[name="quantityBox"]`).val()

    return Number(remainingInventory)
  }

  /**
   * Scrape the Product Page + Checkout and return an IAmazonObject
   *
   * @returns {Promise<IAmazonObject>}
   * @memberof AmazonScraper
   */
  public async getFullProductInformation (): Promise<IAmazonObject> {
    const productPageSelector = await this.accessPage({ url: this.productUrl, method: 'GET' })

    const productObject = await this.processProductPage(productPageSelector)
    const formObject = await this.getAmazonFormObject(productPageSelector)

    if (!formObject) {
      throw new Error(ERROR_TYPE.NO_AMAZON_FORM)
    }

    const inventoryPageSelector = await this.accessPage({
      formData: formObject.formData,
      method: 'POST',
      url: formObject.formUrl,
    })

    const cartPage = await this.accessPage({
      method: 'GET',
      url: 'https://' + Url.parse(this.productUrl).host + '/gp/cart/view.html?ref_=nav_cart',
    })

    const productObjectWithInventory: IAmazonObject = {
      ...productObject,
      inventorySize: this.processCartPage(cartPage, productObject.asin),
    }

    return productObjectWithInventory
  }

  /**
   *  Return the Merchant Name
   *
   * @private
   * @param {any} $
   * @returns {(string | null)}
   * @memberof AmazonScraper
   */
  private scrapeMerchantName ($: any): string {
    return $(this.merchantNameSelector).text().trim()
  }

  /**
   * Return The Merchant Id
   *
   * @private
   * @param {any} $
   * @returns {(string | null)}
   * @memberof AmazonScraper
   */
  private scrapeMerchantId ($: any): string {
    return $(this.merchantIdSelector).val()
  }

  /**
   * Return the Product's Price
   *
   * @private
   * @param {any} $
   * @returns {(string | null)}
   * @memberof AmazonScraper
   */
  private scrapeProductPrice ($: any): number | null {
    const priceId: string | undefined = _.find(this.priceSelectors, (id: any) => {
      return $(id).length > 0
    })

    if (!priceId) {
      return null
    }

    let price = $(priceId).text().trim()

    if (price.includes('.') && price.includes(',')) {
      price = price.replace(',', '')
    } else if (price.includes(',') && !price.includes('.')) {
      price = price.replace(',', '.')
    }

    return Number(
      parseFloat(
        price
          .replace('AED', '')
          .replace('EUR', '')
          .replace('£', '')
          .replace('Â', '')
          .replace('$', '')
          .replace('€', '')
          .trim(),
      ),
    )
  }

  /**
   * Return the main sales rank
   *
   * @private
   * @param {any} $
   * @returns {number}
   * @memberof AmazonScraper
   */
  private scrapeSalesRank ($: any): { mainSalesRank: number; secondarySalesRank: number } {
    const salesRankItem = $(this.salesRankSelector).first()
    const salesRankElemVal = $('#SalesRank')
      .text()
      .trim()
      .toLowerCase()
      .replace('/#/gm', '')
      .replace('/Top 100/gm', '')
      .replace('/[.]/gm', '')

    // const regex = /\+|-?(\d+.\d+.?).([^\(]+)/m;
    const regex = /[-]{0,1}[\d]*[\.]{0,1}[\d]+/m

    const mainSalesRank = +salesRankElemVal.match(regex)[0].replace('.', '')

    const salesRankStr = $(salesRankItem).text().replace('#', '').replace('.', '').replace(',', '').replace('n°', '')

    const secondarySalesRank = +salesRankStr.replace('.', '')

    return {
      mainSalesRank,
      secondarySalesRank,
    }
  }

  private scrapeAdditionalInfo ($: any): IAdditionalInformations {
    let informations: IAdditionalInformations = {
      categories: [],
      ratings: [],
      createdOn: '',
      salesRank: [],
    }
    $('#productDetails_db_sections tr').each((i, elem) => {
      const title: string = $(elem).find('.prodDetSectionEntry').text().trim().toLowerCase()

      let value
      if (title === 'best sellers rank' || title.includes('classement des meilleures ventes')) {
        let rankData = []
        const digitRegex = /(\d+(?:\d+))/gm

        $(elem)
          .find('td > span > span')
          .each((i, elem) => {
            let rank = $(elem)
              .text()
              .trim()
              .replaceAll('#', '')
              .replaceAll(',', '')
              .replaceAll('.', '')
              .match(digitRegex)[0]
            console.log('rank', rank)
            let category = $(elem).find('a').text().toLowerCase().replace('see top 100 in', '').trim()
            let categoryLink = $(elem).find('a').attr('href')

            rankData.push({ categoryLink, category, rank })

            informations.categories.push(category)
          })

        informations.salesRank = rankData
      } else if (title === 'customer reviews' || title === 'moyenne des commentaires client') {
        value = $(elem)
          .find('#averageCustomerReviews')
          .text()
          .replaceAll(',', '.')
          .match(/(\d+(?:[,.]\d+)[(?=.sur 5 étoiles)(?=.out of 5 stars)])/)[0]

        const totalRatings = $(elem)
          .find('#acrCustomerReviewText')
          .text()
          .replace(',', '')
          .replace('.', '')
          .replace(/\s/gm, '')
          .replace('ratings', '')
          .replace('évaluations', '')
          .trim()

        informations.ratings = { score: value, total: totalRatings }
      } else if (title === 'date first available' || title.includes('date de mise en ligne')) {
        value = $(elem).find('td').text().trim()
        informations.createdOn = value
      }
    })
    return informations
  }

  private scrapeCategory ($: any): string {
    const categoryMatch = $(this.categorySelector).attr('href').split('_')

    const category = categoryMatch[categoryMatch.length - 1].trim()

    return category
  }

  /**
   * Return the Product's Title
   *
   * @private
   * @param {any} $
   * @returns {string}
   * @memberof AmazonScraper
   */
  private scrapeProductTitle ($: any): string {
    return $(this.titleSelector).text().trim()
  }

  /**
   *  Return the Product's availability
   *
   * @private
   * @param {any} $
   * @returns {boolean}
   * @memberof AmazonScraper
   */
  private scrapeProductAvailability ($: any): boolean {
    const availability = $(this.isAvailableSelector).text().trim()

    if (availability.match(/(Actuellement indisponible|No disponible|Unavailable)/g)) {
      return false
    }

    return true
  }

  /**
   * Scrape the Product's asin
   *
   * @private
   * @param {any} $
   * @returns {string}
   * @memberof AmazonScraper
   */
  private scrapeProductAsin ($: any): string {
    const asin = $('input[id="ASIN"]').val()

    return asin
  }

  /**
   * Return the Product's form data
   * Used to access the checkout page
   *
   * @private
   * @param {any} $
   * @returns {(IAmazonForm | null)}
   * @memberof AmazonScraper
   */
  private getAmazonFormObject ($: any): IAmazonForm | null {
    const rootUrl = Url.parse(this.productUrl)
    const formData: any = {}

    const cartId = _.find(this.addToCardBtnSelectors, (id: any) => {
      return $(id).length > 0
    })

    if (!cartId) {
      return null
    }

    const cart = $(cartId)

    if (cart.length < 1) {
      return null
    }

    const array = $(cartId).serializeArray()

    let formUrl = $(cartId).attr('action')

    // Check if the url has https and a full url.
    if (formUrl.indexOf('https://www.amazon') < 0) {
      formUrl = formUrl.replace('https://' + rootUrl.host, '')
      formUrl = 'https://' + rootUrl.host + formUrl
    }

    _.each(array, (object: { name: string | number; value: any }) => {
      formData[object.name] = object.value
    })

    formData.quantity = this.defaultQuantity

    return {
      formData,
      formUrl,
    }
  }
}

export default AmazonScraper
