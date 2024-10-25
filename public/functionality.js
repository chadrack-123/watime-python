function weatherApp() {
    return {
        city: '',
        temperature: '',
        humidity: '',
        pressure: '',
        windSpeed: '',
        windDirection: '',
        windGust: '',
        rain: '',
        snowfall: '',
        cloud_cover: '',
        cityName: '',
        visibility: 0,
        description: '',
        weatherIconUrl: '',
        hourlyForecast: [],
        prediction: null,
        error: null,
        loading: false,
        irrigationThreshold: 20,
        irrigateDecision: '',
        irrigation: '',
        noIrrigation: '',
        evapotranspiration: 0.0,

        init() {
            this.getWeatherByLocation();
        },
        async getWeatherByCity() {
            if (!this.city) {
                alert('Please enter a city');
                return;
            }
            await this.fetchWeather(`http://localhost:3000/weather/${this.city || 'johannesburg'}`);
        },
        async getWeatherData() {
            const url = `http://localhost:3000/weather/${this.city || 'johannesburg'}`;

            try {
                console.log('Fetching weather data from OpenWeatherMap API...');
                const response = await axios.get(url);
                console.log('Weather data fetched:', response.data);
                const weatherData = response.data.currentWeather;
                return weatherData;
            } catch (error) {
                console.error('Error fetching weather data:', error);
                throw new Error('Error fetching weather data');
            }
        },
        async extractWeatherFeatures() {
            try {
                console.log('Extracting features...');
                const weatherData = await this.getWeatherData();
                console.log('Raw weather data:', weatherData);

                const features = [
                    weatherData.main.temp - 273.15,
                    weatherData.main.humidity,
                    weatherData.rain && weatherData.rain['1h'] ? weatherData.rain['1h'] : 0,
                    weatherData.main.pressure,
                    weatherData.clouds.all,
                    weatherData.wind.deg,
                    weatherData.snow && weatherData.snow['1h'] ? weatherData.snow['1h'] : 0,
                    weatherData.wind.speed,
                    weatherData.wind.gust ? weatherData.wind.gust : 0
                ];

                console.log('Extracted features:', features);
                return features;
            } catch (error) {
                console.error('Error extracting weather features:', error);
                throw new Error('Error extracting weather features');
            }
        },
        async getSoilMoisturePrediction() {
            this.loading = true;
            this.prediction = null;
            this.error = null;

            try {
                const features = await this.extractWeatherFeatures();

                const response = await axios.post('http://localhost:3000/predict', {
                    features: features
                });

                // const rainfall = features[2];
                // const snowfall = features[6];
                // const precipitation = rainfall + snowfall;

                const predictionData = response.data;

                this.prediction = predictionData.prediction;
                //ET: EvapoTranspiration
                this.evapotranspiration = this.getEvapotranspiration();
                this.irrigateDecision = this.shouldIrrigate(this.prediction, this.evapotranspiration);

                return predictionData;
            } catch (error) {
                console.error('Error making prediction:', error);
                alert('Error making prediction. Please try again.');
            } finally {
                this.loading = false;
            }
        },
        shouldIrrigate(predictedMoisture, evapoTranspiration) {
            const date = new Date();
            const currentHour = date.getHours();
            
            // calculate the ETo from 9 - 16
            

            //Add the equation to handle moisture level to handle irrigation schedule
            // if(precipitation === 0.0){
                //An irrigation time interval (between 5 & 8:59; between 16 & 17:59)
            if(currentHour >= 5 && currentHour <= 8 || currentHour >= 16 && currentHour <= 17){

                if (predictedMoisture <= 20) {
                    return this.irrigation = 'irrigate';
                }
            
            } else {
                return this.noIrrigation = 'No irrigation';
            }
        },
        async getEvapotranspiration(){
            const data = await this.getWeatherData();
        
            try{
                const maxTemp = data.main.temp_max - 273.15;
                const minTemp = data.main.temp_min - 273.15;
                const dailyAvgTemp = (maxTemp + minTemp) / 2;
                const humidity = data.main.humidity;
                const windSpeed = data.wind.speed;
                this.visibility = data.visibility;
                this.rain = data.rain && data.rain['1h'] ? data.rain['1h'] : 0;
                this.snowfall = data.snow && data.snow['1h'] ? data.snow['1h'] : 0;
                const solarRadiation = 20; // On clear, sunny days, solar radiation range from 15 - 25
                
                const albedo = 0.23;
                const psychrometricConstant = 0.066;
                const saturationVaporPressure = 0.6108 * Math.exp((17.27 * dailyAvgTemp) / (dailyAvgTemp + 237.3));
                const slopeOfVaporPressureCurve = (4098 * saturationVaporPressure) / Math.pow((dailyAvgTemp + 237.3), 2);      
                
                const actualVaporPressure = (humidity / 100) * saturationVaporPressure;

                const cloudySkyRadiation = 10; 
                const netShortwaveRadiation = (1 - albedo) * solarRadiation;
                const stefanBoltzmannConstant = 4.903e-9;
                const netLongwaveRadiation = stefanBoltzmannConstant * 
                ((Math.pow(maxTemp + 273.16, 4) + Math.pow(minTemp + 273.16, 4)) / 2) * 
                (0.34 - 0.14 * Math.sqrt(actualVaporPressure)) * 
                (1.35 * (solarRadiation / cloudySkyRadiation) - 0.35);
                const netRadiation = netShortwaveRadiation - netLongwaveRadiation;
                const t_k = (dailyAvgTemp + 273);
                const ETo = (0.408 * slopeOfVaporPressureCurve * (netRadiation - 0) + (psychrometricConstant * (900 / t_k) * windSpeed * (saturationVaporPressure - actualVaporPressure))) / (slopeOfVaporPressureCurve + psychrometricConstant * (1 + 0.34 * windSpeed));
                            
                
                // const ETo = (0.408 * slopeOfVaporPressureCurve * (netRadiation - 0) +  psychrometricConstant * (900 / (dailyAvgTemp + 273)));
                // const Eto2 = windSpeed * (saturationVaporPressure - actualVaporPressure)
                const Kc = 0.8;
                const ETc = ETo * Kc;
                console.log(`EvapoTranspiration (ETc) for warm_season turfgrass/lawn (Bermuda Grass) is: ${ETc.toFixed(2)} mm/day`);
                // console.log(humidity);
                return ETc;
                
            }
            catch(error){
                console.error("Error fetching weather data.", error);
            }
        },
        async getWeatherByLocation() {
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(
                    async position => {
                        const lat = position.coords.latitude;
                        const lon = position.coords.longitude;

                        // Log the latitude and longitude to the console
                        console.log(`Location fetched: Latitude = ${lat}, Longitude = ${lon}`);

                        // Get the city name from the coordinates using OpenCage Geocoder API
                        const cityName = await this.getCityName(lat, lon);
                        console.log(`City Name: ${cityName}`);

                        // Use the cityName for any further operations if needed
                        this.city = cityName;

                        // Fetch weather data based on the location
                        const url = `/weather/${cityName}`; 
                        await this.fetchWeather(url);
                        await this.getSoilMoisturePrediction();
                    },
                    error => {
                        console.error('Error getting location:', error);
                        alert('Unable to retrieve your location. Please enter a city manually.');
                    }
                );
            } else {
                alert('Geolocation is not supported by this browser.');
            }
        },
        async getCityName(lat, lon) {
            const apiKey = 'd8e347904ec4467d8eedcd7ec2b84544';
            const url = `https://api.opencagedata.com/geocode/v1/json?q=${lat}+${lon}&key=${apiKey}`;

            try {
                const response = await axios.get(url);
                const data = response.data;

                console.log('city data', data)

                const city = data.results[0].components.city || data.results[0].components.town || data.results[0].components.village;
                return city || 'Johannesburg';
            } catch (error) {
                console.error('Error fetching city name:', error);
                return 'Unknown Location';
            }
        },

        async fetchWeather(url) {
            try {
                const response = await axios.get(url);
                const data = response.data;

                this.cityName = data.currentWeather.name;
                this.temperature = Math.round(data.currentWeather.main.temp - 273.15) + '°C';
                this.humidity = data.currentWeather.main.humidity + '%';
                this.pressure = data.currentWeather.main.pressure + 'hpa';
                this.windSpeed = data.currentWeather.wind.speed + 'm/s';
                this.windDirection = data.currentWeather.wind.deg + 'deg';
                this.windGust = data.currentWeather.wind.gust + 'm/s';
                this.rain = data.currentWeather.rain + 'mm/h'; // ['1h']
                this.snowfall = data.currentWeather.snow+ 'mm/h'; //['1h'] 
                this.cloud_cover = data.currentWeather.clouds.all + '%';
                this.description = data.currentWeather.weather[0].description;
                this.weatherIconUrl = `https://openweathermap.org/img/wn/${data.currentWeather.weather[0].icon}@4x.png`;

                this.hourlyForecast = data.forecast.slice(0, 8).map(item => ({
                    time: new Date(item.dt * 1000).getHours() + ':00',
                    temp: Math.round(item.main.temp - 273.15) + '°C',
                    iconUrl: `https://openweathermap.org/img/wn/${item.weather[0].icon}.png`,
                }));
            } catch (error) {
                console.error('Error fetching weather data:', error);
                alert('Error fetching weather data. Please try again.');
            }
        },
        displayWeather(data) {
            const temperatureInfo = document.querySelector('.temperatureContainer');
            const weatherInfo = document.querySelector('.weatherInfo');
            const weatherIcon = document.querySelector('.weatherIcon');
            const hourlyForecast = document.querySelector('.hourlyForecast');
        
            temperatureInfo.innerHTML = '';
            weatherInfo.innerHTML = '';
            hourlyForecast.innerHTML = '';
        
            if (data.cod === '404') {
                weatherInfo.innerHTML = `<p>${data.message}</p>`;
            } else {
                const cityName = data.name;
                const temperature = Math.round(data.main.temp - 273.15);
                const description = data.weather[0].description;
                const iconCode = data.weather[0].icon;
                const iconURL = `https://api.openweathermap.org/img/wn/${iconCode}@4.png`;
        
                const temperatureHTML = `<p>${temperature}°C</p>`;
                const weatherHTML = `<p>${cityName}</p><p>${description}</p>`;
        
                temperatureInfo.innerHTML = temperatureHTML;
                weatherInfo.innerHTML = weatherHTML;
                weatherIcon.src = iconURL;
                weatherIcon.alt = description;
        
                showImage();
            }
        },
        formatPrediction(prediction) {
            if (typeof prediction === 'object') {
                return JSON.stringify(prediction, null, 2);
            }
            return prediction;
        },
        displayHourlyForecast(hourlyData) {
            const hourlyForecastContainer = document.querySelector('.hourlyForecast');
            const next24Hours = hourlyData.slice(0, 8);
        
            next24Hours.forEach(item => {
                const dateTime = new Date(item.dt * 1000);
                const hour = dateTime.getHours();
                const temperature = Math.round(item.main.temp - 273.15);
                const iconCode = item.weather[0].icon;
                const iconURL = `https://openweathermap.org/img/wn/${iconCode}.png`;
        
                const hourlyItemHTML = `
                <div class="hourlyItem">
                    <span>${hour}:00</span>
                    <img src="${iconURL}" alt="Hourly Weather Icon">
                    <span>${temperature}°C</span> 
                </div>
            `;
                hourlyForecastContainer.innerHTML += hourlyItemHTML;
            });
        },
        showImage() {
            const weatherIcon = document.querySelector('.weatherIcon');
            weatherIcon.style.display = 'block';
        }
    };
}




