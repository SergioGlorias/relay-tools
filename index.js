const { writeFile, readFile } = require("node:fs/promises")

let token = process.env.LICHESS_TOKEN

fetch("https://lichess.org/api/account", {
    headers: {
        'Authorization': 'Bearer ' + token,
    },
})
    .then(res => res.json())
    .then(json => console.info("ACC USED: ", json.username))

async function fetchGames() {
    const API_URL = 'https://lichess.org/api/stream/games-by-users?withCurrentGames=true';

    try {
        console.log('A conectar...');

        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Authorization': 'Bearer ' + token,
                'Accept': 'application/x-ndjson',
            },
            body: "LeelaKnightOdds,A-Liang"
        });

        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();

        while (true) {
            const { value, done } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value, { stream: true });
            const lines = chunk.split('\n').filter(Boolean);

            for (const line of lines) {
                try {
                    const data = JSON.parse(line)
                    console.log('Data: ', data);

                    const file = await readFile("ids.txt", { encoding: "utf-8" })

                    let ids = file.trim().split(" ")

                    if ([25, 37].includes(data.status) && ids.includes(data.id)) {
                        let s = ids.filter(i => i !== data.id).join(" ").trim()
                        await writeFile("ids.txt", s, { encoding: "utf-8" })
                        console.info("Broadcast update: ", (await updateRound(s)).status)
                        continue;
                    }

                    if (ids.includes(data.id)) continue;

                    ids.push(data.id)

                    const s = ids.join(" ").trim()

                    await writeFile("ids.txt", s, { encoding: "utf-8" })

                    console.log(s)

                    console.info("Broadcast update: ", (await updateRound(s)).status)

                } catch (err) {
                    console.warn('Erro a dar parse:', line, err);
                }
            }
        }

        console.log('Servidor fechou conexão, a reconectar...');
        fetchGames();
    } catch (error) {
        console.error('Erro durante long polling:', error.message);
        setTimeout(fetchGames, 5000);
    }
}

fetchGames();


function updateRound(s) {
    return fetch("https://lichess.org/broadcast/round/4EupTC5M/edit", {
        headers: {
            'Authorization': 'Bearer ' + token,
            'Content-Type': 'application/json'
        },
        method: "POST",
        body: JSON.stringify({
            name: "Match",
            syncIds: s,
            startsAt: 1734033600000
        })
    })
}