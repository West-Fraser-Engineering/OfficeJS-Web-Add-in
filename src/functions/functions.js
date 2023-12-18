import { pushRequest } from "./AesoPoolPriceBatchRequest";
import { parseDate } from "./xlDate";

/**
 * 
 * @customfunction AesoPoolPrice
 * @param {number | string} date 
 * @param {number} hour 
 * @returns {Promise<number[][]}
 */
async function AesoPoolPrice(date, hour) {
    let js_date = parseDate(date);
    const json = await pushRequest(js_date);

    console.log(json);

    // js_date = new Date(js_date.getUTCFullYear(), js_date.getUTCMonth(), js_date.getUTCDate() + 1);

    const begin_datetime_mpt = `${js_date.getUTCFullYear()
        }-${(js_date.getUTCMonth() + 1).toString().padStart(2, '0')
        }-${(js_date.getUTCDate() + 1).toString().padStart(2, '0')
        } ${(hour - 1).toString().padStart(2, '0')
        }:00`
    console.log('Search begin_datetime_mpt', begin_datetime_mpt);
    console.log(json.return["Pool Price Report"])
    for (const item of json.return["Pool Price Report"]) {
        console.log('Compate', item.begin_datetime_mpt, begin_datetime_mpt)
        if (item.begin_datetime_mpt == begin_datetime_mpt) {
            return parseFloat(item.pool_price);
        }
    }

    throw new Error("Not found.")

    // return json;
}

/**Converts an Excel date to a JavaScript date.
 * 
 * @customfunction xlDateToJsDate
 * @param {number} xlSerial - The Excel date serial number
 */
function xlDateToJsDate(xlSerial) {
    return dateFromSerial(xlSerial).toString();
}

/**
 * Take a number as the input value and return a formatted number value as the output.
 * @customfunction
 * @param {number} value
 * @param {string} format (e.g. "0.00%")
 * @returns A formatted number value.
 */
function createFormattedNumber(value, format) {
    return {
        type: "FormattedNumber",
        basicValue: value,
        numberFormat: format
    }
}


/**
 * Logs its input to the dev console.
 * @customfunction
 * @param {any} value
 * @returns
 */
function LogInput(value) {
    console.log(typeof value + ":", value);
}
