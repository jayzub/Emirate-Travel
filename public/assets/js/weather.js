$(document).ready(function () {
    let map1, map2;
    let marker1, marker2;

    // Function to initialize Google Map for location 1
    function initMap1() {
        const defaultLocation = { lat: 43.67, lng: -79.38 }; // Default location (Humber college)
        map1 = new google.maps.Map(document.getElementById("map1"), {
            center: defaultLocation,
            zoom: 6,
        });
    }

    // Function to initialize Google Map for location 2
    function initMap2() {
        const defaultLocation = { lat: 43.67, lng: -79.38 }; // Default location (Humber college)
        map2 = new google.maps.Map(document.getElementById("map2"), {
            center: defaultLocation,
            zoom: 6,
        });
    }

    // Function to load Google Maps API
    function loadGoogleMapsAPI(callback1, callback2) {
        const script = document.createElement("script");
        const GOOGLE_MAPS_API_KEY = 'AIzaSyDF2K4MVXawaKO0IQONBA5Jc04mBIfbdxE';
        script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places`;
        script.defer = true;
        script.async = true;
        script.onload = function () {
            callback1();
            callback2();
        };
        document.head.appendChild(script);
    }

    // Call the function to load Google Maps API for both maps
    loadGoogleMapsAPI(initMap1, initMap2);

    // Click event handler for Get Weather button - Location 1
    $('#getWeather1').click(function () {
        const location = $('#location1').val().trim();

        if (location) {
            $('#results1').empty();
            getWeather(location, '1');
            showMap(location, '1');
        } else {
            alert('Please enter a city or country');
        }
    });

    // Click event handler for Get Weather button - Location 2
    $('#getWeather2').click(function () {
        const location = $('#location2').val().trim();

        if (location) {
            $('#results2').empty();
            getWeather(location, '2');
            showMap(location, '2');
        } else {
            alert('Please enter a city or country');
        }
    });

    // Function to fetch weather data from OpenWeatherMap API
    function getWeather(location, locationNumber) {
        const API_KEY = 'e55fbd884a489adf22eff283bdfc71e6';
        $.ajax({
            url: `https://api.openweathermap.org/data/2.5/weather?q=${location}&appid=${API_KEY}&units=metric`,
            method: 'GET',
            success: function (data) {
                const weatherDescription = data.weather[0].description;
                const temperature = data.main.temp;
                const minTemp = data.main.temp_min;
                const maxTemp = data.main.temp_max;
                const humidity = data.main.humidity;

                $(`#results${locationNumber}`).html(`
                    <p>Weather in ${location}: ${weatherDescription}</p>
                    <p>Temperature: ${temperature} °C</p>
                    <p>Min Temperature: ${minTemp} °C</p>
                    <p>Max Temperature: ${maxTemp} °C</p>
                    <p>Humidity: ${humidity}%</p>
                `);

                // Check if both locations have been searched
                if ($('#results1').html() && $('#results2').html()) {
                    compareWeather();
                }
            },
            error: function () {
                alert('Error retrieving weather data');
            }
        });
    }

    // Function to geocode location and show on map
    function showMap(location, locationNumber) {
        const geocoder = new google.maps.Geocoder();
        geocoder.geocode({ address: location }, function (results, status) {
            if (status === 'OK') {
                const latLng = results[0].geometry.location;

                if (locationNumber === '1' && map1) {
                    map1.setCenter(latLng); // Center map to new location
                    if (marker1) {
                        marker1.setMap(null); // Remove previous marker from map
                    }
                    marker1 = new google.maps.Marker({
                        position: latLng,
                        map: map1,
                        title: location
                    });
                } else if (locationNumber === '2' && map2) {
                    map2.setCenter(latLng); // Center map to new location
                    if (marker2) {
                        marker2.setMap(null); // Remove previous marker from map
                    }
                    marker2 = new google.maps.Marker({
                        position: latLng,
                        map: map2,
                        title: location
                    });
                } else {
                    alert('Map not initialized');
                }
            } else {
                alert(`Geocode was not successful for ${locationNumber} for the following reason: ` + status);
            }
        });
    }

    // Function to compare weather data between two locations
    function compareWeather() {
        const temp1 = parseFloat($('#results1').find('p:nth-child(2)').text().split(':')[1].trim().replace('°C', ''));
        const temp2 = parseFloat($('#results2').find('p:nth-child(2)').text().split(':')[1].trim().replace('°C', ''));
        const minTemp1 = parseFloat($('#results1').find('p:nth-child(3)').text().split(':')[1].trim().replace('°C', ''));
        const minTemp2 = parseFloat($('#results2').find('p:nth-child(3)').text().split(':')[1].trim().replace('°C', ''));
        const maxTemp1 = parseFloat($('#results1').find('p:nth-child(4)').text().split(':')[1].trim().replace('°C', ''));
        const maxTemp2 = parseFloat($('#results2').find('p:nth-child(4)').text().split(':')[1].trim().replace('°C', ''));
        const humidity1 = parseInt($('#results1').find('p:nth-child(5)').text().split(':')[1].trim().replace('%', ''));
        const humidity2 = parseInt($('#results2').find('p:nth-child(5)').text().split(':')[1].trim().replace('%', ''));

        const temperatureDifference = Math.abs(temp1 - temp2).toFixed(1);
        const minTempDifference = Math.abs(minTemp1 - minTemp2).toFixed(1);
        const maxTempDifference = Math.abs(maxTemp1 - maxTemp2).toFixed(1);
        const humidityDifference = Math.abs(humidity1 - humidity2);

        $('#comparisonSection').css('display', 'block');
        $('#temperatureDifference').html(`<p>Temperature Difference: ${temperatureDifference} °C</p>`);
        $('#minMaxDifference').html(`<p>Min Temperature Difference: ${minTempDifference} °C</p><p>Max Temperature Difference: ${maxTempDifference} °C</p>`);
        $('#humidityDifference').html(`<p>Humidity Difference: ${humidityDifference}%</p>`);
    }
});
