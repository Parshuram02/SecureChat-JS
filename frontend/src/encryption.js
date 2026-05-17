import CryptoJS from 'crypto-js';

/**
 * Encrypts a message using the Room ID as the secret key.
 * In a production app, this would be a separate user-defined password.
 */
export const encryptMessage = (message, roomId) => {
    try {
        return CryptoJS.AES.encrypt(message, roomId).toString();
    } catch (error) {
        console.error('Encryption Error:', error);
        return message;
    }
};

/**
 * Decrypts a message using the Room ID as the secret key.
 */
export const decryptMessage = (ciphertext, roomId) => {
    try {
        const bytes = CryptoJS.AES.decrypt(ciphertext, roomId);
        const originalText = bytes.toString(CryptoJS.enc.Utf8);
        return originalText || '[Unable to decrypt - check Room ID]';
    } catch (error) {
        console.error('Decryption Error:', error);
        return '[Decryption Failed]';
    }
};
