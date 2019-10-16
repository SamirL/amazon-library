# amazon-library

### Why ?

To scrape products info on amazon and keep track of the inventory (Useful for competition tracking (Sales/Revenue etc...))

## How to 

###Install
`````
npm install
npm build
`````

###Usage

````
const AmazonScraper = require('amazon-lib/lib/index').default
const url = 'YOUR AMAZON PRODUCT URL'
const result = await new AmazonScraper(url).getFullProductInformation()
//// Will return an object
///{
///  productUrl: string;
///  title: string;
///  asin: string;
///  category: string;
///  merchantId: string;
///  merchantName: string;
///  isAvailable: boolean;
///  price: number | null;
///  inventorySize?: number;
///  salesRank: object;
///}
``````
