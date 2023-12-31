const axios = require('axios').default;

console.log("Init...")

const clientId = "t2ia0m1vobq1z03mj5fi15xo4kkqgl"
const clientSecret = "ubjqijinyyxf279hrukk14rtliyzjd"
const grantType = "client_credentials"

const notionKey = "secret_8Pkgoyeu2NKu19ozxkS4NiCkRFlUSVXHDxtlbx0fUqb"
const dataBaseId = "ef46ed8046494f3c977f38f24a595ecb"

let gameSlug = "castlevania-symphony-of-the-night"

const urlIGDBAuth =  `https://id.twitch.tv/oauth2/token?client_id=${clientId}&client_secret=${clientSecret}&grant_type=${grantType}`

axios({
    method: 'post',
    url: urlIGDBAuth
}).then(function (response) {
    const authCredentials = response.data
    
    const header = {
        'Accept': 'application/json',
        'Client-ID': clientId,
        'Authorization': `Bearer ${authCredentials["access_token"]}`
    }

    let paylaod = `fields\
        name,\
        genres.name,\
        cover.image_id,\
        franchises.name,\
        involved_companies.company.name;\
        where slug = "${gameSlug}";`

    axios({
        headers: header,
        method: 'post',
        url: 'https://api.igdb.com/v4/games',
        data: paylaod
    }).then(function (response) {
        
        let gameMetada = {
            name: response.data[0].name,
            cover: `https://images.igdb.com/igdb/image/upload/t_cover_big/${response.data[0].cover.image_id}.png`
        }

        let franchises = []
        response.data[0].franchises.forEach(function(element, i) {
            franchises[i] = element.name
        });

        gameMetada.franchises = franchises

        let genres = []
        response.data[0].genres.forEach(function(element, i) {
            genres[i] = element.name
        });

        gameMetada.genres = genres

        let developers = []
        response.data[0].involved_companies.forEach(function(element, i) {
            developers[i] = element.company.name
        });

        gameMetada.developers = developers

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
                "Franquias": {
                    "rich_text": [
                        {
                            "type": "text",
                            "text":{
                                "content": gameMetada.franchises.toString()
                            }
                        }
                    ]
                },
                "Desenvolvedoras": {
                    "rich_text": [
                        {
                            "type": "text",
                            "text":{
                                "content": gameMetada.developers.toString()
                            }
                        }
                    ]
                }
            }
        }

        axios({
            headers: header,
            method: 'post',
            url: url,
            data: pageObj
        }).then(function (response) {
            console.log("Script completed successfully!")
        });

    });

});

