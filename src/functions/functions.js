
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

    console.log(json);

    const results = [];
    for (const item of json.return["Pool Price Report"]) {
        results.push([item.pool_price]);
    }

    return results;
}

CustomFunctions.associate("AesoPoolPrice", AesoPoolPrice);

/**Converts an Excel date serial into a Date object.
 * 
 * @param {number} xlSerial - The Excel date serial number
 * @returns 
 */
function dateFromSerial(xlSerial) {
  // milliseconds since 1899-12-31T00:00:00Z, corresponds to Excel serial 0.
  const xlSerialOffset = -2209075200000; 

  let elapsedDays;
  // each serial up to 60 corresponds to a valid calendar date.
  // serial 60 is 1900-02-29. This date does not exist on the calendar.
  // we choose to interpret serial 60 (as well as 61) both as 1900-03-01
  // so, if the serial is 61 or over, we have to subtract 1.
  if (xlSerial < 61) {
    elapsedDays = xlSerial;
  }
  else {
    elapsedDays = xlSerial - 1;
  }

  // javascript dates ignore leap seconds
  // each day corresponds to a fixed number of milliseconds:
  // 24 hrs * 60 mins * 60 s * 1000 ms
  const millisPerDay = 86400000;
    
  const jsTimestamp = xlSerialOffset + elapsedDays * millisPerDay;
  return new Date(jsTimestamp);
}