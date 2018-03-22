const { createClient } = require('../client');
require('isomorphic-fetch');

const call = createCall({
    rpchost: '127.0.0.1',
    rpcuser: 'test',
    rpcpassword: 'test',
    rpcport: '18443',
});

call('getwalletinfo help')
.then(res => res.json())
.then(res => console.log(res))
.catch(e => console.log(e));
