$(document).ready(function () {
    const API_KEY = '955a74aae657af146ceab1c3';
    const API_URL = `https://v6.exchangerate-api.com/v6/${API_KEY}/latest/USD`;

    let conversionRates = {};

    // Fetch currency data from API and initialize autocomplete
    $.get(API_URL, function(data) {
        if (data.result === "success") {
            conversionRates = data.conversion_rates;
            const currencies = Object.keys(conversionRates);
            $('#currency1, #currency2').autocomplete({
                source: currencies
            });
        } else {
            alert('Error fetching currency data');
        }
    });

    $('#convert').click(function () {
        const currency1 = $('#currency1').val().trim().toUpperCase();
        const currency2 = $('#currency2').val().trim().toUpperCase();
        const amount = $('#amount').val().trim();

        if (currency1 && currency2 && amount) {
            convertCurrency(currency1, currency2, amount);
        } else {
            alert('Please enter currency codes and amount.');
        }
    });

    $('#swap').click(function () {
        // Swap currency values
        const temp = $('#currency1').val();
        $('#currency1').val($('#currency2').val());
        $('#currency2').val(temp);

        // Recalculate on swap
        const currency1 = $('#currency1').val().trim().toUpperCase();
        const currency2 = $('#currency2').val().trim().toUpperCase();
        const amount = $('#amount').val().trim();

        if (currency1 && currency2 && amount) {
            convertCurrency(currency1, currency2, amount);
        }
    });

    function convertCurrency(currency1, currency2, amount) {
        if (!(currency1 in conversionRates) || !(currency2 in conversionRates)) {
            alert('Invalid currency codes entered.');
            return;
        }

        const rate1 = conversionRates[currency1];
        const rate2 = conversionRates[currency2];
        const convertedAmount = (amount / rate1) * rate2;
        const formattedAmount = Number(convertedAmount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        const rate = (rate2 / rate1).toFixed(4);

        $('#conversionResult').html(`<p>${Number(amount).toLocaleString()} ${currency1} = ${formattedAmount} ${currency2}</p><p>1 ${currency1} = ${rate} ${currency2}</p>`);

        // Reverse Conversion
        const reverseConvertedAmount = (convertedAmount / rate2) * rate1;
        const formattedReverseAmount = Number(reverseConvertedAmount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        const reverseRate = (rate1 / rate2).toFixed(4);

        $('#reverseConversionResult').html(`<p>${formattedAmount} ${currency2} = ${formattedReverseAmount} ${currency1}</p><p>1 ${currency2} = ${reverseRate} ${currency1}</p>`);
    }
});
