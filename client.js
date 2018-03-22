const initialRequest = {
    method: 'POST',
};

const initialHeaders = {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
};

const initialBody = {
    params: [],
    jsonrpc: '1.0',
};

const createAuthorizationHeaders = (rpcuser, rpcpassword) => ({ 'Authorization': `Basic ${new Buffer(rpcuser+':'+rpcpassword).toString('base64')}`});
const toArray = params => Array.isArray(params) ? params : [params];
const buildEndpoint = ({ rpcscheme = 'http', rpchost = '127.0.0.1', rpcport = 8332 }) => `${rpcscheme}://${rpchost}:${rpcport}`;
const id = (method, params = []) => `${method}_${toArray(params).join('=')}_${s4()}`;
const s4 = () => Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);

const createClient = ({
  rpcscheme = 'http',
  rpchost = '127.0.0.1',
  rpcport = 8332,
  rpcuser,
  rpcpassword,
}) => {
    const endpoint = buildEndpoint({ rpcscheme , rpchost, rpcport });
    const request = {
        ...initialRequest,
        headers: {
            ...initialHeaders,
            ...createAuthorizationHeaders(rpcuser, rpcpassword),
        },
    };

    return (method, ...params) => fetch(
        endpoint,
        {
            ...request,
            body: {
                ...initialBody,
                id: id(method),
                method,
                params: toArray(params),
            },
        }
    );
};

function checkStatus(response) {
    // we assume 400 as valid code here because it's the default return code when sth has gone wrong,
    // but then we have an error within the response, no?
    if (response.status >= 200 && response.status <= 400) {
        return response;
    }

    const error = new Error(response.statusText);
    error.response = response;
    throw error;
}

function checkError(data, req, debug = false) {
    if (data.error) {
        /* eslint-disable no-console */
        if (debug === true && console && console.error) {
            console.error(`Request ID ${data.id} failed: ${data.error}`);
        } else if (debug === true && console && console.log) {
            console.log(`Request ID ${data.id} failed: ${data.error}`);
        }
        /* eslint-enable no-console */

        const error = new RpcError(data.error, req, data);
        error.response = data;

        throw error;
    }

    return data;
}

function logResponse(response, debug = false) {
    if (debug === true) {
        /* eslint-disable no-console */
        console.log('Got response for id', response.id, 'with response', response.result);
        console.log('Response message for request', response.id, ':', response.result.message);
        /* eslint-enable no-console */
    }

    return response.result;
}

/**
 * RpcError is a simple error wrapper holding the request and the response.
 */
class RpcError extends Error {
    constructor(message, request, response) {
        super(message);

        this.name = 'RpcError';
        this.message = (message || '');
        this.request = request;
        this.response = response;
    }

    toString() {
        return this.message;
    }

    getRequest() {
        return this.request;
    }

    getResponse() {
        return this.response;
    }
}

module.exports = {
    initialRequest,
    initialHeaders,
    initialBody,
    createAuthorizationHeaders,
    toArray,
    buildEndpoint,
    id,
    s4,
    createClient,
};