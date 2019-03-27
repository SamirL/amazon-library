"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const lodash_1 = require("lodash");
const cheerio_1 = require("cheerio");
const request_1 = require("request");
const request_promise_native_1 = require("request-promise-native");
const url_1 = require("url");
var ERROR_TYPE;
(function (ERROR_TYPE) {
    ERROR_TYPE["REQUEST_FAILED"] = "REQUEST_FAILED";
    ERROR_TYPE["NO_INVENTORY"] = "NO_INVENTORY";
    ERROR_TYPE["INCORRECT_INVENTORY"] = "NO_INVENTORY";
    ERROR_TYPE["LIMIT_INVENTORY"] = "LIMIT_INVENTORY";
    ERROR_TYPE["NO_HTML_BODY"] = "NO_HTML_BODY";
    ERROR_TYPE["CONFIRMATION_ERROR"] = "CONFIRMATION_ERROR";
    ERROR_TYPE["NO_AMAZON_FORM"] = "NO_AMAZON_FORM";
})(ERROR_TYPE || (ERROR_TYPE = {}));
class AmazonScraper {
    constructor(productUrl) {
        this.titleSelector = 'h1#title';
        this.merchantIdSelector = '#merchantID';
        this.addToCardBtnSelectors = ['#addToCart', '#handleBuy'];
        this.priceSelectors = [
            '#priceblock_ourprice',
            '#priceblock_saleprice',
            '#priceBlock .priceLarge',
            '#actualPriceContent .priceLarge',
            '#actualPriceValue .priceLarge',
        ];
        this.salesRankSelector = '.zg_hrsr_item .zg_hrsr_rank';
        this.alertBoxSelector = '#huc-v2-box-warning';
        this.confirmTextSelector = '#confirm-text';
        this.remainingInventorySelector = '#hucArgsNewItems';
        this.isAvailableSelector = ['#outOfStock', '#availability', '.availRed'];
        this.defaultQuantity = 999;
        this.cookieJar = request_1.default.jar();
        this.productUrl = productUrl;
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
    accessPage(object) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const $ = yield request_promise_native_1.default({
                    uri: object.url,
                    method: object.method,
                    form: object.formData,
                    jar: this.cookieJar,
                    followAllRedirects: true,
                    resolveWithFullResponse: true,
                    transform(body) {
                        return cheerio_1.default.load(body);
                    },
                });
                return $;
            }
            catch (error) {
                throw new Error(error);
            }
        });
    }
    /**
     * Return a Product's Information
     *
     * @param {CheerioSelector} $
     * @returns {Promise<IAmazonObject>}
     * @memberof AmazonScraper
     */
    processProductPage($) {
        return __awaiter(this, void 0, void 0, function* () {
            const title = this.scrapeProductTitle($);
            const price = this.scrapeProductPrice($);
            const merchantId = this.scrapeMerchantId($);
            const isAvailable = this.scrapeProductAvailability($);
            const salesRank = this.scrapeSalesRank($);
            const asin = this.scrapeProductAsin($);
            const productObject = {
                asin,
                isAvailable,
                merchantId,
                price,
                productUrl: this.productUrl,
                salesRank,
                title,
            };
            return productObject;
        });
    }
    /**
     * Scrape the Checkout Page and return the Inventory
     *
     * @param {CheerioSelector} $
     * @returns {number}
     * @memberof AmazonScraper
     */
    processCheckoutPage($) {
        const htmlBody = $('body').html();
        if (!htmlBody) {
            throw new Error(ERROR_TYPE.NO_HTML_BODY);
        }
        if (htmlBody &&
            htmlBody.match(/(Veuillez confirmer que|Confirma que quieres|Please confirm|faut que nous nous assurions que vous)/g)) {
            throw new Error(ERROR_TYPE.CONFIRMATION_ERROR);
        }
        else if (htmlBody && htmlBody.match(/(Votre mise à jour a)/g)) {
            throw new Error(ERROR_TYPE.REQUEST_FAILED);
        }
        // Checking if the inventory is present on the page
        // If not it means we cannot know the exact value
        let inventoryText;
        const alertBox = $(this.alertBoxSelector);
        const confirmText = $(this.confirmTextSelector);
        // Checking the inventory available or if there is a limit per product
        if (alertBox.length > 0) {
            const match = htmlBody.match(/(?:de los|a que|than the) ([0-9]+) (?:disponibles|de disponible|available)/);
            const match2 = htmlBody.match(/(?:limite de vente de|limit of) ([0-9]+) (?:articles|per customer)/);
            if (match) {
                inventoryText = match[1];
            }
            else if (match2) {
                throw new Error(ERROR_TYPE.LIMIT_INVENTORY);
            }
        }
        else if (confirmText.length > 0) {
            inventoryText = confirmText.text().trim();
        }
        else {
            const match = htmlBody.match(/\((([^)]+ (articles|article|producto|productos|items|item)))\)/g);
            if (match) {
                inventoryText = match[0];
            }
        }
        if (!inventoryText) {
            throw new Error(ERROR_TYPE.NO_INVENTORY);
        }
        const remainingInvDiv = $(this.remainingInventorySelector);
        const inventoryNumber = Number(inventoryText
            .replace('(', '')
            .replace(')', '')
            .replace('articles', '')
            .replace('article', '')
            .replace('items', '')
            .replace('item', ''));
        const hiddenInventoryConfirmation = Number($(remainingInvDiv)
            .val()
            .split(',')[1]);
        if (hiddenInventoryConfirmation !== inventoryNumber) {
            throw new Error(ERROR_TYPE.INCORRECT_INVENTORY);
        }
        return inventoryNumber;
    }
    /**
     * Scrape the Product Page + Checkout and return an IAmazonObject
     *
     * @returns {Promise<IAmazonObject>}
     * @memberof AmazonScraper
     */
    getFullProductInformation() {
        return __awaiter(this, void 0, void 0, function* () {
            const productPageSelector = yield this.accessPage({ url: this.productUrl, method: 'GET' });
            const productObject = yield this.processProductPage(productPageSelector);
            const formObject = yield this.getIAmazonFormObject(productPageSelector);
            if (!formObject) {
                throw new Error(ERROR_TYPE.NO_AMAZON_FORM);
            }
            const inventoryPageSelector = yield this.accessPage({
                url: formObject.formUrl,
                method: 'POST',
                formData: formObject.formData,
            });
            const productObjectWithInventory = Object.assign({}, productObject, { inventorySize: this.processCheckoutPage(inventoryPageSelector) });
            return productObjectWithInventory;
        });
    }
    /**
     * Return The Merchant Id
     *
     * @private
     * @param {CheerioSelector} $
     * @returns {(string | null)}
     * @memberof AmazonScraper
     */
    scrapeMerchantId($) {
        return $(this.merchantIdSelector).val();
    }
    /**
     * Return the Product's Price
     *
     * @private
     * @param {CheerioSelector} $
     * @returns {(string | null)}
     * @memberof AmazonScraper
     */
    scrapeProductPrice($) {
        const priceId = lodash_1.default.find(this.priceSelectors, (id) => {
            return $(id).length > 0;
        });
        if (!priceId) {
            return null;
        }
        return Number($(priceId)
            .text()
            .replace('EUR', '')
            .replace(',', '.')
            .replace('£', '')
            .replace('Â', '')
            .replace('$', '')
            .replace('€', '')
            .trim());
    }
    /**
     * Return the main sales rank
     *
     * @private
     * @param {CheerioSelector} $
     * @returns {number}
     * @memberof AmazonScraper
     */
    scrapeSalesRank($) {
        const salesRankItem = $(this.salesRankSelector).first();
        const salesRankStr = $(salesRankItem)
            .text()
            .replace('#', '')
            .replace('.', '')
            .replace(',', '')
            .replace('n°', '');
        const salesRank = parseInt(salesRankStr, 2);
        return salesRank;
    }
    /**
     * Return the Product's Title
     *
     * @private
     * @param {CheerioSelector} $
     * @returns {string}
     * @memberof AmazonScraper
     */
    scrapeProductTitle($) {
        return $(this.titleSelector)
            .text()
            .trim();
    }
    /**
     *  Return the Product's availability
     *
     * @private
     * @param {CheerioSelector} $
     * @returns {boolean}
     * @memberof AmazonScraper
     */
    scrapeProductAvailability($) {
        const availability = $(this.isAvailableSelector)
            .text()
            .trim();
        if (availability.match(/(Actuellement indisponible|No disponible|Unavailable)/g)) {
            return false;
        }
        return true;
    }
    /**
     * Scrape the Product's asin
     *
     * @private
     * @param {CheerioSelector} $
     * @returns {string}
     * @memberof AmazonScraper
     */
    scrapeProductAsin($) {
        const asin = $('input[id="ASIN"]').val();
        return asin;
    }
    /**
     * Return the Product's form data
     * Used to access the checkout page
     *
     * @private
     * @param {CheerioSelector} $
     * @returns {(IAmazonForm | null)}
     * @memberof AmazonScraper
     */
    getIAmazonFormObject($) {
        const rootUrl = url_1.default.parse(this.productUrl);
        const formData = {};
        const cartId = lodash_1.default.find(this.addToCardBtnSelectors, (id) => {
            return $(id).length > 0;
        });
        if (!cartId) {
            return null;
        }
        const cart = $(cartId);
        if (cart.length < 1) {
            return null;
        }
        const array = $(cartId).serializeArray();
        let formUrl = $(cartId).attr('action');
        // Check if the url has https and a full url.
        if (formUrl.indexOf('https://www.amazon') < 0) {
            formUrl = formUrl.replace('https://' + rootUrl.host, '');
            formUrl = 'https://' + rootUrl.host + formUrl;
        }
        lodash_1.default.each(array, (object) => {
            formData[object.name] = object.value;
        });
        formData.quantity = this.defaultQuantity;
        return {
            formData,
            formUrl,
        };
    }
}
exports.default = AmazonScraper;
