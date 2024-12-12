const { writeFile, readFile } = require("node:fs/promises")


let token = process.env.LICHESS_TOKEN

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
            body: "bolus2,gmbibi,iamstraw,ricky8632200,promacherrrr,chess0281"
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

                    let ids = file.split(" ")

                    if (ids.includes(data.id)) continue;

                    ids.push(data.id)

                    const s = ids.join(" ").trim()

                    await writeFile("ids.txt", s, { encoding: "utf-8" })

                    console.log(s)

                    const round = await fetch("https://lichess.org/broadcast/round/oSGqYi3q/edit", {
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
                    }).then(res => res.json())

                    console.log(round)

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