import process from 'process';

// Suppress specific deprecation warnings that are known and safe to ignore
// [DEP0169] url.parse() is frequently used in older or transitional dependencies (like MongoDB driver < 7 or even 7.0.0 in some contexts)
// and replacing it requires library updates. Suppressing it cleans up the logs.

const originalEmit = process.emit;
process.emit = function (name, data, ...args) {
    if (name === 'warning' && typeof data === 'object' && data.name === 'DeprecationWarning' && data.code === 'DEP0169') {
        return false;
    }
    return originalEmit.apply(process, [name, data, ...args]);
};
