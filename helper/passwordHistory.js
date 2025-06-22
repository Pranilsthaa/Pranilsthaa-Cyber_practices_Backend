const bcrypt = require('bcrypt');
const {runQuery} = require('../connection');

const isPasswordRepeated = async (userId, newPassword) => {
  console.log('Checking password history for user:', userId);
  try {
    if (!userId) {
      throw new Error('userId must be provided to check password history.');
    }
    const passwordHistory = await runQuery(
      'SELECT password FROM password_history WHERE user_id = ?',
      [userId],
    );
    for (const record of passwordHistory) {
      const isMatch = await bcrypt.compare(newPassword, record.password);
      console.log(isMatch);
      if (isMatch) {
        return true;
      }
    }
    return false;
  } catch (error) {
    console.error('Error checking password history:', error);
    throw error;
  }
};

module.exports = {
  isPasswordRepeated,
};
