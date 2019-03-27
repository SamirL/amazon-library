/// <reference types="cheerio" />
import { IAmazonObject } from './interfaces/amazon';
interface IRequestObject {
    url: string;
    method: string;
    formData?: object;
}
declare class AmazonScraper {
    private cookieJar;
    private productUrl;
    private readonly titleSelector;
    private readonly merchantIdSelector;
    private readonly addToCardBtnSelectors;
    private readonly priceSelectors;
    private readonly salesRankSelector;
    private readonly alertBoxSelector;
    private readonly confirmTextSelector;
    private readonly remainingInventorySelector;
    private readonly isAvailableSelector;
    private readonly defaultQuantity;
    constructor(productUrl: string);
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
    accessPage(object: IRequestObject): Promise<CheerioSelector>;
    /**
     * Return a Product's Information
     *
     * @param {CheerioSelector} $
     * @returns {Promise<IAmazonObject>}
     * @memberof AmazonScraper
     */
    processProductPage($: CheerioSelector): Promise<IAmazonObject>;
    /**
     * Scrape the Checkout Page and return the Inventory
     *
     * @param {CheerioSelector} $
     * @returns {number}
     * @memberof AmazonScraper
     */
    processCheckoutPage($: CheerioSelector): number;
    /**
     * Scrape the Product Page + Checkout and return an IAmazonObject
     *
     * @returns {Promise<IAmazonObject>}
     * @memberof AmazonScraper
     */
    getFullProductInformation(): Promise<IAmazonObject>;
    /**
     * Return The Merchant Id
     *
     * @private
     * @param {CheerioSelector} $
     * @returns {(string | null)}
     * @memberof AmazonScraper
     */
    private scrapeMerchantId;
    /**
     * Return the Product's Price
     *
     * @private
     * @param {CheerioSelector} $
     * @returns {(string | null)}
     * @memberof AmazonScraper
     */
    private scrapeProductPrice;
    /**
     * Return the main sales rank
     *
     * @private
     * @param {CheerioSelector} $
     * @returns {number}
     * @memberof AmazonScraper
     */
    private scrapeSalesRank;
    /**
     * Return the Product's Title
     *
     * @private
     * @param {CheerioSelector} $
     * @returns {string}
     * @memberof AmazonScraper
     */
    private scrapeProductTitle;
    /**
     *  Return the Product's availability
     *
     * @private
     * @param {CheerioSelector} $
     * @returns {boolean}
     * @memberof AmazonScraper
     */
    private scrapeProductAvailability;
    /**
     * Scrape the Product's asin
     *
     * @private
     * @param {CheerioSelector} $
     * @returns {string}
     * @memberof AmazonScraper
     */
    private scrapeProductAsin;
    /**
     * Return the Product's form data
     * Used to access the checkout page
     *
     * @private
     * @param {CheerioSelector} $
     * @returns {(IAmazonForm | null)}
     * @memberof AmazonScraper
     */
    private getIAmazonFormObject;
}
export default AmazonScraper;
