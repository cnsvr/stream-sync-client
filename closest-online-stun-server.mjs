import fetch from 'node-fetch';
const GEO_LOC_URL = "https://raw.githubusercontent.com/pradt2/always-online-stun/master/geoip_cache.txt";
const IPV4_URL = "https://raw.githubusercontent.com/pradt2/always-online-stun/master/valid_ipv4s.txt";
const GEO_USER_URL = "https://geolocation-db.com/json/";

(async () => {
    try {
        const geoLocs = await (await fetch(GEO_LOC_URL)).json();
        const { latitude, longitude } = await (await fetch(GEO_USER_URL)).json();
        const closestAddr = (await (await fetch(IPV4_URL)).text()).trim().split('\n')
            .map(addr => {
                const [stunLat, stunLon] = geoLocs[addr.split(':')[0]];
                const dist = ((latitude - stunLat) ** 2 + (longitude - stunLon) ** 2) ** .5;
                return [addr, dist];
            })
            .reduce(([addrA, distA], [addrB, distB]) => distA <= distB ? [addrA, distA] : [addrB, distB])[0];
        console.log(closestAddr); // prints the IP:PORT of the closest STUN server
    } catch (error) {
        console.error('Error fetching data:', error);
    }
})();
