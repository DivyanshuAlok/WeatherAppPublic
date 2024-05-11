import {
  StyleSheet,
  Text,
  View,
  PermissionsAndroid,
  Button,
  TouchableOpacity,
  FlatList,
  Dimensions,
} from 'react-native';
import React, {useEffect, useState} from 'react';

import Geolocation from '@react-native-community/geolocation';

import {API_KEY} from '@env';

const apiKey = API_KEY;
// create a .env File to and save your AccuWeather APIKey https://developer.accuweather.com/

const windowWidth = Dimensions.get('window').width;
const windowHeight = Dimensions.get('window').height;

// Responsiveness
const rh = h => (h / 737.0909090909091) * windowHeight;
const rw = w => (w / 392.72727272727275) * windowWidth;

const completeDay = day => {
  switch (day) {
    case 'Mon':
      return 'Monday';
      break;
    case 'Tue':
      return 'Tuesday';
      break;
    case 'Wed':
      return 'Wednesday';
      break;
    case 'Thu':
      return 'Thursday';
      break;
    case 'Fri':
      return 'Friday';
      break;
    case 'Sat':
      return 'Saturday';
      break;
    case 'Sun':
      return 'Sunday';
      break;
    default:
      break;
  }
};

const requestLocationPermission = async () => {
  try {
    const granted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      {
        title: 'MyTracker Location Permission',
        message:
          'MyTracker needs access to your location services ' +
          'for its basic funtionality.',
        buttonNegative: 'Cancel',
        buttonPositive: 'OK',
      },
    );
    if (PermissionsAndroid.RESULTS.GRANTED === granted) {
      console.log('Location permission Accessible');
      return true;
    } else {
      console.log('Location permission Denied');
      return false;
    }
  } catch (err) {
    console.warn(err);
  }
};

const App = () => {
  const [locPermission, setLocPermission] = useState(false);
  const [location, setLocation] = useState({});
  // const [locStr, setLocStr] = useState({});
  const [currentCondition, setCurrentCondition] = useState({});
  const [forecast, setForecast] = useState([]);
  const [selectedDate, setSelectedDate] = useState({});

  const fetchRegion = async (location, apiKey) => {
    fetch(
      `http://dataservice.accuweather.com/locations/v1/cities/geoposition/search?apikey=${apiKey}&q=${location.lat},${location.lng}`,
      {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
      },
    )
      .then(response => response.json())
      .then(data => {
        // console.log(data);
        // console.log(
        //   'location API : ',
        //   data.Key,
        //   data.LocalizedName,
        //   data.SupplementalAdminAreas[0].LocalizedName,
        //   data.AdministrativeArea.LocalizedName,
        //   data.Country.LocalizedName,
        // );
        setLocation({
          ...location,
          key: data.Key,
          name: data.LocalizedName,
          fullName:
            data.SupplementalAdminAreas[0].LocalizedName +
            ', ' +
            data.AdministrativeArea.LocalizedName +
            ', ' +
            data.Country.LocalizedName,
        });
        Promise.all([
          fetchCurrentCondition(data.Key, apiKey),
          futureForecast(data.Key, apiKey),
        ])
          .then(() => {
            console.log('fetched all data');
          })
          .catch(() => {
            console.log('some error');
          });
      })
      .catch(error => {
        console.error(error);
      });
  };

  const fetchCurrentCondition = async (locationKey, apiKey) => {
    // console.log('Fetch fetchCurrentCondition');
    fetch(
      `http://dataservice.accuweather.com/currentconditions/v1/${locationKey}?apikey=${apiKey}&details=true`,
      {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
      },
    )
      .then(response => response.json())
      .then(data => {
        // console.log(
        //   'current condition API : ',
        //   data[0].WeatherText,
        //   data[0].Temperature.Metric.Value,
        //   data[0].Temperature.Metric.Unit,
        //   data[0].RealFeelTemperatureShade.Metric.Value,
        //   data[0].RelativeHumidity,
        //   data[0].TemperatureSummary.Past24HourRange.Maximum.Metric.Value,
        //   data[0].TemperatureSummary.Past24HourRange.Minimum.Metric.Value,
        // );
        setCurrentCondition({
          condition: data[0].WeatherText,
          date: new Date(data[0].LocalObservationDateTime).toDateString(),
          temp: data[0].Temperature.Metric.Value,
          unit: data[0].Temperature.Metric.Unit,
          realFeel: data[0].RealFeelTemperatureShade.Metric.Value,
          humidity: data[0].RelativeHumidity,
          maxTemp:
            data[0].TemperatureSummary.Past24HourRange.Maximum.Metric.Value,
          minTemp:
            data[0].TemperatureSummary.Past24HourRange.Minimum.Metric.Value,
        });
      });
  };

  const futureForecast = async (locationKey, apiKey) => {
    fetch(
      `http://dataservice.accuweather.com/forecasts/v1/daily/5day/${locationKey}?apikey=${apiKey}`,
      {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
      },
    )
      .then(response => response.json())
      .then(data => {
        let arr = data.DailyForecasts.map(x => {
          return {
            date: new Date(x.Date).toDateString(),
            day: x.Day.IconPhrase,
            night: x.Night.IconPhrase,
            high: x.Temperature.Maximum.Value,
            low: x.Temperature.Minimum.Value,
          };
        });
        setForecast([...arr]);
        console.log(forecast);
      });
  };

  useEffect(() => {
    requestLocationPermission().then(permission => {
      setLocPermission(permission);

      Geolocation.getCurrentPosition(ret => {
        console.log('ret ', ret);
        setLocation({
          lat: ret.coords.latitude,
          lng: ret.coords.longitude,
          timestamp: ret.timestamp,
        });
        // console.log('location info', location);

        fetchRegion(
          {
            lat: ret.coords.latitude,
            lng: ret.coords.longitude,
            timestamp: ret.timestamp,
          },
          apiKey,
        );
      });
    });
  }, []);

  const refresh = () => {
    Geolocation.getCurrentPosition(ret => {
      console.log('ret ', ret);
      setLocation({
        lat: ret.coords.latitude,
        lng: ret.coords.longitude,
        timestamp: ret.timestamp,
      });
      fetchRegion(
        {
          lat: ret.coords.latitude,
          lng: ret.coords.longitude,
          timestamp: ret.timestamp,
        },
        apiKey,
      );
    });
  };

  const renderItem = ({item}) => {
    const borderWidth = item.date === selectedDate.date ? 1 : 0;
    return (
      <TouchableOpacity
        onPress={() => {
          setSelectedDate({...item});
        }}>
        <View
          style={{
            marginHorizontal: rw(10),
            alignItems: 'center',
            backgroundColor: 'rgba(0, 0, 0, 0.2)',
            borderRadius: rw(10),
            padding: rw(5),
            paddingVertical: rh(10),
            width: rw(100),
            borderWidth: borderWidth,
            borderColor: 'rgb(256, 256, 256)',
            marginTop: rh(10),
          }}>
          <Text style={styles.otherData}>{item.date.split(' ')[0]}</Text>
          {/*  */}
          <Text style={styles.otherData}>{item.day}</Text>
          <Text style={styles.otherData}>
            {Math.floor(
              (((item.high - 32) * 5) / 9 + ((item.low - 32) * 5) / 9) / 2,
            )}
            &deg;{currentCondition.unit}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {locPermission === true ? (
        <View style={styles.weatherContainer}>
          <View style={styles.headers}>
            <View>
              <Text style={styles.headerText}>{location.name}</Text>
              <Text style={styles.headerSubText}>{location.fullName}</Text>
            </View>
            <TouchableOpacity
              style={{justifyContent: 'center'}}
              onPress={refresh}>
              <Text style={styles.headerSubText}>Refresh</Text>
            </TouchableOpacity>
          </View>

          {Object.keys(currentCondition).length !== 0 ? (
            <View style={styles.body}>
              <Text
                style={[
                  styles.headerSubText,
                  {fontSize: 50, transform: [{scaleY: 1.5}]},
                ]}>
                {currentCondition.temp}&deg;{currentCondition.unit}
              </Text>
              <View style={{marginTop: 20, alignItems: 'center'}}>
                <Text style={styles.headerText}>
                  {currentCondition.condition}
                </Text>
                <Text style={styles.otherData}>
                  {' '}
                  {completeDay(
                    currentCondition.date.split(' ').slice()[0],
                  )}{' '}
                  {currentCondition.date.split(' ').slice(1).join(' ')}
                </Text>
              </View>
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  width: '40%',
                  marginVertical: 25,
                }}>
                <View>
                  <Text style={styles.otherData}>Feels Like</Text>
                  <Text style={styles.otherData}>Humidity</Text>
                  <Text style={styles.otherData}>Today's Max</Text>
                  <Text style={styles.otherData}>Today's Min</Text>
                </View>
                <View>
                  <Text style={styles.otherData}>
                    {currentCondition.realFeel} &deg; {currentCondition.unit}
                  </Text>
                  <Text style={styles.otherData}>
                    {currentCondition.humidity} %
                  </Text>
                  <Text style={styles.otherData}>
                    {currentCondition.maxTemp} {currentCondition.unit}
                  </Text>
                  <Text style={styles.otherData}>
                    {currentCondition.minTemp} {currentCondition.unit}
                  </Text>
                </View>
              </View>
            </View>
          ) : (
            <View />
          )}

          <View style={styles.otherForecast}>
            <FlatList
              horizontal
              ListFooterComponentStyle={{backgroundColor: 'yellow'}}
              data={forecast}
              renderItem={renderItem}
              keyExtractor={item => item.date}
            />

            {Object.keys(selectedDate).length !== 0 ? (
              <View
                style={{
                  margin: rh(10),
                  flexDirection: 'row',
                  borderColor: 'white',
                  borderWidth: 1,
                  borderRadius: rw(10),
                  marginRight: rw(20),
                }}>
                <View
                  style={{
                    borderRadius: rw(10),
                    backgroundColor: 'rgba(0, 0, 0, 0.2)',
                    padding: rw(10),
                    alignItems: 'center',
                    width: 100,
                  }}>
                  <Text style={styles.otherData}>
                    {completeDay(selectedDate.date.split(' ').slice()[0])}
                  </Text>
                  <Text style={[styles.otherData, {fontSize: 30}]}>
                    {selectedDate.date.split(' ').slice()[2]}
                  </Text>
                  <Text style={styles.otherData}>
                    {selectedDate.date.split(' ').slice()[1]}{' '}
                    {selectedDate.date.split(' ').slice()[3]}
                  </Text>
                </View>
                <View style={{padding: 10}}>
                  <Text style={styles.otherData}>
                    Day Time : {selectedDate.day}
                  </Text>
                  <Text style={styles.otherData}>
                    Night Time : {selectedDate.night}
                  </Text>
                  <Text style={styles.otherData}>
                    Highest : {Math.floor(((selectedDate.high - 32) * 5) / 9)}
                    &deg;
                    {currentCondition.unit}
                  </Text>
                  <Text style={styles.otherData}>
                    Lowest : {Math.floor(((selectedDate.low - 32) * 5) / 9)}
                    &deg;
                    {currentCondition.unit}
                  </Text>
                </View>
              </View>
            ) : (
              <View />
            )}
          </View>
        </View>
      ) : (
        <View style={styles.weatherContainer}>
          <Text>Location Permission Denied</Text>
        </View>
      )}
    </View>
  );
};

export default App;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#5397E2',
    padding: rw(10),
    paddingTop: rh(20),
  },
  weatherContainer: {
    flex: 1,
  },
  headers: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    paddingHorizontal: rw(20),
    borderRadius: rw(10),
  },
  body: {
    flex: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  otherForecast: {
    flex: 2,
    marginBottom: rh(10),
    alignItems: 'stretch',
    justifyContent: 'center',
  },

  headerText: {
    color: 'white',
    fontSize: rw(27),
  },
  headerSubText: {
    color: 'white',
    fontSize: rw(15),
  },
  otherData: {
    color: 'white',
  },
});
