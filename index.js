const axios = require('axios').default;
const fs = require('fs');

const clientId = "t2ia0m1vobq1z03mj5fi15xo4kkqgl"
const clientSecret = "ubjqijinyyxf279hrukk14rtliyzjd"
const grantType = "client_credentials"

const notionKey = "secret_8Pkgoyeu2NKu19ozxkS4NiCkRFlUSVXHDxtlbx0fUqb"
const dataBaseId = "ef46ed8046494f3c977f38f24a595ecb"

const urlIGDBAuth =  `https://id.twitch.tv/oauth2/token?client_id=${clientId}&client_secret=${clientSecret}&grant_type=${grantType}`

let gamesSlug = [
    'final-fantasy-tactics', 
    'grand-theft-auto-san-andreas',
    'the-elder-scrolls-v-skyrim',
    'call-of-duty-modern-warfare-2',
    'shadow-of-the-colossus--2',
    'hollow-knight',
    'guitar-hero-ii',
    'elden-ring'

]
let gamesMetada = []

console.log("Init...")
main()

async function main(){
    for (let gameSlug of gamesSlug){
        await axios({
            method: 'post',
            url: urlIGDBAuth
        }).then(async function (response) {
            let authCredentials = response.data
            
            let header = {
                'Accept': 'application/json',
                'Client-ID': clientId,
                'Authorization': `Bearer ${authCredentials["access_token"]}`
            }
        
            let paylaod = `fields\
                name,\
                genres.name,\
                cover.image_id,\
                franchises.name,\
                release_dates.y,\
                platforms.name,\
                involved_companies.company.name;\
                where slug = "${gameSlug}";`
        
            await axios({
                headers: header,
                method: 'post',
                url: 'https://api.igdb.com/v4/games',
                data: paylaod
            }).then(async function (response) {
                
                let gameMetada = {
                    name: response.data[0].name,
                    cover: `https://images.igdb.com/igdb/image/upload/t_cover_big/${response.data[0].cover.image_id}.png`
                }
        
                let genres = []
                await response.data[0].genres.forEach(function(element, i) {
                    genres[i] = element.name
                });
        
                gameMetada.genres = genres
                gameMetada.franchise = response.data[0].franchises ? response.data[0].franchises[0].name : ""
                gameMetada.developer = response.data[0].involved_companies[0].company.name
                gameMetada.release_date = response.data[0].release_dates[0].y
                gameMetada.release_platform = response.data[0].platforms[0].name
    
                gamesMetada.push(gameMetada)

                const url = "https://api.notion.com/v1/pages/"

                const header = {
                    "Authorization": "Bearer " + notionKey,
                    "Content-Type": "application/json",
                    "Notion-Version": "2022-06-28"
                }

                let pageObj = {
                    "parent": { "database_id": dataBaseId },
                    "properties": {
                        "Capa": {
                            "files": [
                                {
                                    "type": "external",
                                    "name": "image cover",
                                    "external": {
                                        "url": gameMetada.cover
                                    }
                                }
                            ]
                        },
                        "Nome": { 
                            "title":[
                                {
                                    "text": {
                                        "content": gameMetada.name
                                    }
                                }
                            ]
                        },
                        "Gêneros": {
                            "rich_text": [
                                {
                                    "type": "text",
                                    "text":{
                                        "content": gameMetada.genres.toString()
                                    }
                                }
                            ]
                        },
                        "Franquia": {
                            "rich_text": [
                                {
                                    "type": "text",
                                    "text":{
                                        "content": gameMetada.franchise
                                    }
                                }
                            ]
                        },
                        "Desenvolvedoras": {
                            "rich_text": [
                                {
                                    "type": "text",
                                    "text":{
                                        "content": gameMetada.developer
                                    }
                                }
                            ]
                        },
                        "Data de Lançamento": {
                            "rich_text": [
                                {
                                    "type": "text",
                                    "text":{
                                        "content": gameMetada.release_date.toString()
                                    }
                                }
                            ]
                        },
                        "Plataforma": {
                            "rich_text": [
                                {
                                    "type": "text",
                                    "text":{
                                        "content": gameMetada.release_platform
                                    }
                                }
                            ]
                        }
                    }
                };

                await axios({
                    headers: header,
                    method: 'post',
                    url: url,
                    data: pageObj
                });
            });
        });
    };

    const jsonContent = JSON.stringify(gamesMetada);
    
    const arquivo = './games.json';

    await fs.writeFile(arquivo, jsonContent, 'utf8', (err) => {
        if (err) {
            console.error('Ocorreu um erro ao gravar o arquivo JSON:', err);
            return;
        }
        console.log('O arquivo JSON foi criado e gravado com sucesso.');
        console.log("Script completed successfully!");
    });
}