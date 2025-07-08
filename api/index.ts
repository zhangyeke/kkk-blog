const cache = new Map();

async function getBio() {
    // 添加一个假的延迟，以便让等待更加明显。
    await new Promise(resolve => {
        setTimeout(resolve, 3000);
    });

    return `The Beatles were an English rock band, 
    formed in Liverpool in 1960, that comprised 
    John Lennon, Paul McCartney, George Harrison 
    and Ringo Starr.`;
}

export function fetchData(url) {
    if (!cache.has(url)) {
        // 如果缓存里没有，就创建一个新的 Promise 并存进去
        cache.set(url, getBio());
    }

    // 总是从缓存里返回 Promise
    return cache.get(url);
}