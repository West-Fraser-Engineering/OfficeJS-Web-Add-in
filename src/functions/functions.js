
/**
 * 
 * @customfunction AesoPoolPrice
 * @param {number} date 
 * @param {number} hour 
 * @returns {Promise<number[][]}
 */
async function AesoPoolPrice(date, hour) {
    console.log(localStorage.getItem('aeso-api-key'));

    const js_date = dateFromSerial(date);
    let year = js_date.getFullYear().toFixed();
    let month = js_date.getMonth().toFixed();
    let day = js_date.getDate().toFixed();
    month = month.padStart(2 - month.length, "0");
    day = month.padStart(2 - day.length, "0");
    const endpoint = `http://localhost:38820/https://api.aeso.ca/report/v1.1/price/poolPrice?startDate=${year}-${month}-${day}&endDate=${year}-${month}-${day}`;

    const response = await fetch(endpoint, {
        headers: {
            'X-API-Key': localStorage.getItem('aeso-api-key')
        }
    });

    const json = await response.json();

    const results = [];
    for (const item of json.return["Pool Price Report"]) {
        results.push([item.pool_price]);
    }

    return results;
}

CustomFunctions.associate("AesoPoolPrice", AesoPoolPrice);

/**Converts an Excel date serial into a Date object.
 * 
 * @param {number} serial - The Excel date serial number
 * @returns 
 */
function dateFromSerial(serial) {
    const milliseconds_since_jan_1_1900 = (serial - 1) * 24 * 3600 * 1000;
    const jan_1_1900 = new Date(1900, 0, 1, 0, 0, 0, 0);
    return new Date(jan_1_1900.getTime() + milliseconds_since_jan_1_1900);
}