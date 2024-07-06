import { DateTime } from "luxon";


const API_KEY = '70eda7a6faffd5ddf3c2cdbc53dd9023'
const BASE_URL ='https://api.openweathermap.org/data/2.5/'
const getWeatherData = (infoType, searchparams) => {
    const url = new URL(BASE_URL+infoType);
    url.search = new URLSearchParams({...searchparams, appid: API_KEY});
    console.log(url);

    return fetch(url).then((res) => res.json());
};

const iconUrlFromCode = (icon) =>` https://openweathermap.org/img/wn/${icon}@2x.png`;

const formatToLocalTime = (secs, offset, format ="cccc, dd LLL yyyy' | local time:'hh:mm a") => 
    DateTime.fromSeconds(secs +offset, {zone: 'utc'}).toFormat(format);

const formatCurrent = (data) => {
    
    console.log(data);
    const {
        coord: {lat,lon},
        main: {temp, feels_like, temp_min, temp_max, humidity},
        name,
        dt,
        sys: {country, sunrise, sunset},
        weather,
        wind: {speed},
        timezone,
    } = data;

    const {main: details, icon} = weather[0]
    const formattedLocalTime = formatToLocalTime(dt,timezone)


    return {
        temp,
        feels_like,
        temp_min,
        temp_max,
        humidity,
        name,
        country,
        sunrise: formatToLocalTime(sunrise, timezone, 'hh:mm a'),
        sunset: formatToLocalTime(sunset, timezone,'hh:mm a'), 
        speed,
        details,
        icon: iconUrlFromCode(icon),
        formattedLocalTime,
        dt,
        timezone,
        lat,
        lon

    };
};
//hourly
const formatedForecastWeather = (secs, offset,data) => {
    console.log(secs);
    const hourly = data.filter(f=>f.dt > secs).map((f)=>({
        temp: f.main.temp,
        title:formatToLocalTime(f.dt,offset,'hh:mm a'),
        icon: iconUrlFromCode(f.weather[0].icon),
        date: f.dt_txt,
    }))
    .slice(0,5);


    //daily
    const daily = data
    .filter((f) => f.dt_txt.slice(-8)==="00:00:00")
    .map((f) =>({
        temp: f.main.temp,
        title: formatToLocalTime(f.dt,offset,"ccc"),
        icon: iconUrlFromCode(f.weather[0].icon),
        data: f.dt_txt,


    }));


    return{hourly, daily};
};

const getFormattedWeatherData = async(searchparams) => {
    const formatCurrentWeather = await getWeatherData(
        "weather",
        searchparams 
    ).then(formatCurrent);

    const{dt,lat,lon,timezone} = formatCurrentWeather;
    const formattedForecastWeather = await getWeatherData('forecast', 
        {lat,lon,units: searchparams.units}).then((d) => formatedForecastWeather(dt,timezone,d.list))

    return{...formatCurrentWeather, ...formattedForecastWeather};
};

export default getFormattedWeatherData;