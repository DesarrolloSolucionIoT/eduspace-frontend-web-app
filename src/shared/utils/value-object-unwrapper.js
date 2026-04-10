export function unwrapValue(obj) {
    if (obj === null || obj === undefined) {
        return obj;
    }

    if (typeof obj === 'object' && obj.value !== undefined) {
        return obj.value;
    }

    return obj;
}

export function unwrapValueObjects(obj) {
    if (!obj || typeof obj !== 'object') {
        return obj;
    }

    const unwrapped = { ...obj };

    for (const key in unwrapped) {
        if (unwrapped[key] && typeof unwrapped[key] === 'object' && unwrapped[key].value !== undefined) {
            unwrapped[key] = unwrapped[key].value;
        }
    }

    return unwrapped;
}
