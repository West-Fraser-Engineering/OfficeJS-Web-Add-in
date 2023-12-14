
/**
 * 
 * @customfunction AesoPoolPrice
 * @param {number} date 
 * @param {number} hour 
 * @returns
 */
function AesoPoolPrice(date, hour) {
    console.log(localStorage.getItem('aeso-api-key'));
    return -1;
}

CustomFunctions.associate("AesoPoolPrice", AesoPoolPrice);