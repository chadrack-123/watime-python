// Define the irrigationData function globally for Alpine.js
document.addEventListener('alpine:init', () => {
    Alpine.data('irrigationData', () => ({
        temperature: "",
        forecast: "",
        nextWatering: "Afternoon, 4:00 PM",
        //nextWatering: "Tomorrow, 5:00 AM",
        alerts: "System is ready.", // Single definition for alerts
        isIrrigating: false, // Track if irrigation is running
        status: "All good",
        city: '',  // Optionally, set a default city
        cityName: '',
        hourlyForecast: [], // To store hourly forecast data

        startIrrigation() {
            this.isIrrigating = true;
            this.alerts = "Irrigation started!";
        },

        stopIrrigation() {
            this.isIrrigating = false;
            this.alerts = "Irrigation stopped!";
        },

        async fetchWeather() {
            try {
                const url = `http://localhost:3000/weather/${this.city || 'johannesburg'}`;
                console.log(`Fetching weather data from: ${url}`);
                
                const response = await axios.get(url);
                const data = response.data;

                // Update reactive properties
                this.cityName = data.currentWeather.name;
                this.temperature = Math.round(data.currentWeather.main.temp - 273.15) + '°C'; // Convert Kelvin to Celsius
                this.forecast = data.currentWeather.weather[0].description;
                this.weatherIconUrl = `https://openweathermap.org/img/wn/${data.currentWeather.weather[0].icon}@4x.png`;

                this.hourlyForecast = data.forecast.slice(0, 8).map(item => ({
                    time: new Date(item.dt * 1000).getHours() + ':00',
                    temp: Math.round(item.main.temp - 273.15) + '°C',
                    iconUrl: `https://openweathermap.org/img/wn/${item.weather[0].icon}.png`,
                }));

                // Trigger a DOM update after async operation is done
                this.$nextTick(() => {
                    console.log('Weather data updated successfully. Temperature is now:', this.temperature);
                });

            } catch (error) {
                console.error('Error fetching weather data:', error);
                alert('Error fetching weather data. Please try again.');
            }
        },

        // Automatically call the fetchWeather when the component is initialized
        init() {
            this.fetchWeather();
        }
    }));
});

// Use DOMContentLoaded for non-Alpine.js specific operations like chart rendering
document.addEventListener('DOMContentLoaded', function() {
    // Initialize Water Usage Chart
    const ctxWaterUsage = document.getElementById('waterUsageChart').getContext('2d');
    const waterUsageChart = new Chart(ctxWaterUsage, {
        type: 'line',
        data: {
            labels: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
            datasets: [{
                label: 'Water Usage (Liters)',
                data: [1200, 1100, 1000, 1300, 1200, 1400, 220],
                backgroundColor: 'rgba(0, 123, 255, 0.2)',
                borderColor: 'rgba(0, 123, 255, 1)',
                borderWidth: 2
            }]
        },
        options: {
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });

    // Initialize Moisture Level Chart
    const ctxMoistureLevel = document.getElementById('moistureLevelChart').getContext('2d');
    const moistureLevelChart = new Chart(ctxMoistureLevel, {
        type: 'bar',
        data: {
            labels: ['Zone 1', 'Zone 2', 'Zone 3', 'Zone 4'],
            datasets: [{
                label: 'Moisture Level (%)',
                data: [45, 50, 42, 48],
                backgroundColor: 'rgba(40, 167, 69, 0.2)',
                borderColor: 'rgba(40, 167, 69, 1)',
                borderWidth: 2
            }]
        },
        options: {
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
});
