$(document).ready(function() {
    // Initialize Google Map
    const map = new google.maps.Map(document.getElementById('map'), {
        center: { lat: 43.67, lng: -79.38 }, // Default location (Humber college)
        zoom: 15 // Default zoom level
    });

    // Geocode location and place marker
    const geocoder = new google.maps.Geocoder();
    const address = '59 Hayden Street, Toronto';

    // Handle form submission
    $('#contactForm').submit(function(event) {
        event.preventDefault(); 
        // Get form data
        const formData = {
            fullName: $('#fullName').val(),
            email: $('#email').val(),
            message: $('#message').val()
        };

        // Send POST request to save contact
        $.ajax({
            type: 'POST',
            url: '/save-contact',
            data: formData,
            success: function(response) {
                alert('Form submitted successfully!');
                // Optionally, redirect or handle UI updates on success
            },
            error: function(error) {
                console.error('Error submitting form:', error);
                // Handle error cases
            }
        });

        // Clear form fields after submission
        $('#fullName').val('');
        $('#email').val('');
        $('#message').val('');
    });
});
