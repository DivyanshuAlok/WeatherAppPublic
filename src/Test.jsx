import React, {useState, useEffect} from 'react';
import {View, Text, Button, PermissionsAndroid, FlatList} from 'react-native';
import {BleManager} from 'react-native-ble-plx';

const bleManager = new BleManager();

const BluetoothScreen = () => {
  const [scanning, setScanning] = useState(false);
  const [devices, setDevices] = useState([]);

  const requestBluetoothPermissions = async () => {
    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        {
          title: 'Bluetooth Permission',
          message:
            'This app requires access to your Fine location to scan for Bluetooth devices.',
          buttonNeutral: 'Ask Me Later',
          buttonNegative: 'Cancel',
          buttonPositive: 'OK',
        },
      );
      const granted1 = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
        {
          title: 'Bluetooth Permission',
          message:
            'This app requires access to your Fine location to scan for Bluetooth devices.',
          buttonNeutral: 'Ask Me Later',
          buttonNegative: 'Cancel',
          buttonPositive: 'OK',
        },
      );
      const bluetoothPermission = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
      );
      console.log('bluetoothPermission', bluetoothPermission);

      if (bluetoothPermission === PermissionsAndroid.RESULTS.GRANTED) {
        console.log('Bluetooth permission granted');
        startDeviceScan();
      } else {
        console.log('Bluetooth permission denied');
      }
    } catch (error) {
      console.error('Error requesting Bluetooth permissions:', error);
    }
  };

  const startDeviceScan = async () => {
    // setScanning(true);

    bleManager.startDeviceScan(
      [],
      {allowDuplicates: false},
      // null,null,
      (error, scannedDevice) => {
        if (error) {
          console.log('Error scanning devices:', error);
          // console.log('PermissionsAndroid', PermissionsAndroid)
          return;
        }

        if (scannedDevice) {
          const device = scannedDevice;
          console.log('Found device:', device);
          setDevices(prevDevices => [...prevDevices, scannedDevice]);
          setTimeout(() => {
            bleManager.stopDeviceScan();
          }, 5000);
        }
      },
    );
  };

  const renderItem = ({item}) => (
    <View>
      <Text>{item.name}</Text>
    </View>
  );
  useEffect(() => {
    requestBluetoothPermissions();

    // Cleanup function
    return () => {
      bleManager.stopDeviceScan();
    };
  }, []);

  return (
    <View style={{flex: 1, alignItems: 'center', justifyContent: 'center'}}>
      <Button
        title={scanning ? 'Scanning...' : 'Scan Devices'}
        onPress={startDeviceScan}
        disabled={scanning}
      />

      <FlatList
        data={devices}
        renderItem={renderItem}
        keyExtractor={(item, index) => index.toString()}
      />
    </View>
  );
};

export default BluetoothScreen;
