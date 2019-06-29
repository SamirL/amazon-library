"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var cheerio_1 = __importDefault(require("cheerio"));
var lodash_1 = __importDefault(require("lodash"));
var request_1 = __importDefault(require("request"));
var request_promise_native_1 = __importDefault(require("request-promise-native"));
var url_1 = __importDefault(require("url"));
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
var AmazonScraper = /** @class */ (function () {
    function AmazonScraper(productUrl) {
        this.titleSelector = 'h1#title';
        this.merchantIdSelector = '#merchantID';
        this.merchantNameSelector = '#sellerProfileTriggerId';
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
    AmazonScraper.prototype.accessPage = function (object) {
        return __awaiter(this, void 0, void 0, function () {
            var $, error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, request_promise_native_1.default({
                                uri: object.url,
                                form: object.formData,
                                jar: this.cookieJar,
                                method: object.method,
                                followAllRedirects: true,
                                resolveWithFullResponse: true,
                                transform: function (body) {
                                    return cheerio_1.default.load(body);
                                },
                            })];
                    case 1:
                        $ = _a.sent();
                        return [2 /*return*/, $];
                    case 2:
                        error_1 = _a.sent();
                        throw new Error(error_1);
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Return a Product's Information
     *
     * @param {CheerioSelector} $
     * @returns {Promise<IAmazonObject>}
     * @memberof AmazonScraper
     */
    AmazonScraper.prototype.processProductPage = function ($) {
        return __awaiter(this, void 0, void 0, function () {
            var title, price, merchantId, merchantName, isAvailable, salesRank, asin, productObject;
            return __generator(this, function (_a) {
                title = this.scrapeProductTitle($);
                price = this.scrapeProductPrice($);
                merchantId = this.scrapeMerchantId($);
                merchantName = this.scrapeMerchantName($);
                isAvailable = this.scrapeProductAvailability($);
                salesRank = this.scrapeSalesRank($);
                asin = this.scrapeProductAsin($);
                productObject = {
                    asin: asin,
                    isAvailable: isAvailable,
                    merchantId: merchantId,
                    price: price,
                    productUrl: this.productUrl,
                    salesRank: salesRank,
                    title: title,
                };
                return [2 /*return*/, productObject];
            });
        });
    };
    /**
     * Scrape the Checkout Page and return the Inventory
     *
     * @param {CheerioSelector} $
     * @param {string} asin
     * @returns {number}
     * @memberof AmazonScraper
     */
    AmazonScraper.prototype.processCheckoutPage = function ($, asin) {
        var htmlBody = $('body').html();
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
        var inventoryText;
        var alertBox = $(this.alertBoxSelector);
        var confirmText = $(this.confirmTextSelector);
        // Checking the inventory available or if there is a limit per product
        if (alertBox.length > 0) {
            var match = htmlBody.match(/(?:de los|a que|than the) ([0-9]+) (?:disponibles|de disponible|available)/);
            var match2 = htmlBody.match(/(?:limite de vente de|limit of) ([0-9]+) (?:articles|per customer)/);
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
            var match = htmlBody.match(/\((([^)]+ (articles|article|producto|productos|items|item)))\)/g);
            if (match) {
                inventoryText = match[0];
            }
        }
        if (!inventoryText) {
            throw new Error(ERROR_TYPE.NO_INVENTORY);
        }
        // const remainingInvDiv = $(`div[data-asin="${asin}"]`);
        // tslint:disable-next-line:no-console
        // console.log(remainingInvDiv)
        var inventoryNumber = Number(inventoryText);
        var hiddenInventoryConfirmation = Number($(inventoryText)
            .val()
            .split(',')[1]);
        if (hiddenInventoryConfirmation !== inventoryNumber) {
            throw new Error(ERROR_TYPE.INCORRECT_INVENTORY);
        }
        return inventoryNumber;
    };
    AmazonScraper.prototype.processCartPage = function ($, asin) {
        var remainingInventory = $("input[name=\"quantityBox\"]").val();
        return Number(remainingInventory);
    };
    /**
     * Scrape the Product Page + Checkout and return an IAmazonObject
     *
     * @returns {Promise<IAmazonObject>}
     * @memberof AmazonScraper
     */
    AmazonScraper.prototype.getFullProductInformation = function () {
        return __awaiter(this, void 0, void 0, function () {
            var productPageSelector, productObject, formObject, inventoryPageSelector, cartPage, productObjectWithInventory;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.accessPage({ url: this.productUrl, method: 'GET' })];
                    case 1:
                        productPageSelector = _a.sent();
                        return [4 /*yield*/, this.processProductPage(productPageSelector)];
                    case 2:
                        productObject = _a.sent();
                        return [4 /*yield*/, this.getAmazonFormObject(productPageSelector)];
                    case 3:
                        formObject = _a.sent();
                        if (!formObject) {
                            throw new Error(ERROR_TYPE.NO_AMAZON_FORM);
                        }
                        return [4 /*yield*/, this.accessPage({
                                formData: formObject.formData,
                                method: 'POST',
                                url: formObject.formUrl,
                            })];
                    case 4:
                        inventoryPageSelector = _a.sent();
                        return [4 /*yield*/, this.accessPage({
                                method: 'GET',
                                url: 'https://' + url_1.default.parse(this.productUrl).host + '/gp/cart/view.html?ref_=nav_cart',
                            })];
                    case 5:
                        cartPage = _a.sent();
                        productObjectWithInventory = __assign({}, productObject, { inventorySize: this.processCartPage(cartPage, productObject.asin) });
                        return [2 /*return*/, productObjectWithInventory];
                }
            });
        });
    };
    /**
     *  Return the Merchant Name
     *
     * @private
     * @param {CheerioSelector} $
     * @returns {(string | null)}
     * @memberof AmazonScraper
     */
    AmazonScraper.prototype.scrapeMerchantName = function ($) {
        return $(this.merchantNameSelector).text().trim();
    };
    /**
     * Return The Merchant Id
     *
     * @private
     * @param {CheerioSelector} $
     * @returns {(string | null)}
     * @memberof AmazonScraper
     */
    AmazonScraper.prototype.scrapeMerchantId = function ($) {
        return $(this.merchantIdSelector).val();
    };
    /**
     * Return the Product's Price
     *
     * @private
     * @param {CheerioSelector} $
     * @returns {(string | null)}
     * @memberof AmazonScraper
     */
    AmazonScraper.prototype.scrapeProductPrice = function ($) {
        var priceId = lodash_1.default.find(this.priceSelectors, function (id) {
            return $(id).length > 0;
        });
        if (!priceId) {
            return null;
        }
        return Number(parseFloat($(priceId)
            .text()
            .replace('AED', '')
            .replace('EUR', '')
            .replace(',', '.')
            .replace('£', '')
            .replace('Â', '')
            .replace('$', '')
            .replace('€', '')
            .trim()));
    };
    /**
     * Return the main sales rank
     *
     * @private
     * @param {CheerioSelector} $
     * @returns {number}
     * @memberof AmazonScraper
     */
    AmazonScraper.prototype.scrapeSalesRank = function ($) {
        var salesRankItem = $(this.salesRankSelector).first();
        var salesRankElemVal = $('#SalesRank')
            .text()
            .trim();
        var regex = /\+|-?(\d+.\d+.?).([^\(]+)/m;
        var mainSalesRank = +salesRankElemVal.match(regex)[1].replace('.', '');
        var salesRankStr = $(salesRankItem)
            .text()
            .replace('#', '')
            .replace('.', '')
            .replace(',', '')
            .replace('n°', '');
        var secondarySalesRank = +salesRankStr.replace('.', '');
        return {
            mainSalesRank: mainSalesRank,
            secondarySalesRank: secondarySalesRank,
        };
    };
    /**
     * Return the Product's Title
     *
     * @private
     * @param {CheerioSelector} $
     * @returns {string}
     * @memberof AmazonScraper
     */
    AmazonScraper.prototype.scrapeProductTitle = function ($) {
        return $(this.titleSelector)
            .text()
            .trim();
    };
    /**
     *  Return the Product's availability
     *
     * @private
     * @param {CheerioSelector} $
     * @returns {boolean}
     * @memberof AmazonScraper
     */
    AmazonScraper.prototype.scrapeProductAvailability = function ($) {
        var availability = $(this.isAvailableSelector)
            .text()
            .trim();
        if (availability.match(/(Actuellement indisponible|No disponible|Unavailable)/g)) {
            return false;
        }
        return true;
    };
    /**
     * Scrape the Product's asin
     *
     * @private
     * @param {CheerioSelector} $
     * @returns {string}
     * @memberof AmazonScraper
     */
    AmazonScraper.prototype.scrapeProductAsin = function ($) {
        var asin = $('input[id="ASIN"]').val();
        return asin;
    };
    /**
     * Return the Product's form data
     * Used to access the checkout page
     *
     * @private
     * @param {CheerioSelector} $
     * @returns {(IAmazonForm | null)}
     * @memberof AmazonScraper
     */
    AmazonScraper.prototype.getAmazonFormObject = function ($) {
        var rootUrl = url_1.default.parse(this.productUrl);
        var formData = {};
        var cartId = lodash_1.default.find(this.addToCardBtnSelectors, function (id) {
            return $(id).length > 0;
        });
        if (!cartId) {
            return null;
        }
        var cart = $(cartId);
        if (cart.length < 1) {
            return null;
        }
        var array = $(cartId).serializeArray();
        var formUrl = $(cartId).attr('action');
        // Check if the url has https and a full url.
        if (formUrl.indexOf('https://www.amazon') < 0) {
            formUrl = formUrl.replace('https://' + rootUrl.host, '');
            formUrl = 'https://' + rootUrl.host + formUrl;
        }
        lodash_1.default.each(array, function (object) {
            formData[object.name] = object.value;
        });
        formData.quantity = this.defaultQuantity;
        return {
            formData: formData,
            formUrl: formUrl,
        };
    };
    return AmazonScraper;
}());
exports.default = AmazonScraper;
