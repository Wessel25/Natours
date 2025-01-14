import axios from 'axios';
import { showAlert } from './alerts';

//type is either 'password' or 'data'
export const updateSettings = async (data, type) => {
  try {
    console.log('updateSettings.js: line 6, updateSettings()');
    const url =
      type === 'password'
        ? 'http://127.0.0.1:3000/api/v1/users/updatePassword'
        : 'http://127.0.0.1:3000/api/v1/users/updateMe';

    console.log(url);
    const res = await axios({
      method: 'PATCH',
      url,
      data,
    });
    console.log(res.data.status);
    if (res.data.status === 'Success') {
      showAlert('success', `${type.toUpperCase()} updated successfully!`);
    }
  } catch (err) {
    showAlert('error', err.response.data.message);
  }
};
