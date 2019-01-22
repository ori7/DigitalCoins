$(document).ready(function () {

    let allCoins = [];

    $("#searchButton").click(function (e) {

        e.preventDefault();

        const filterItems = (query) => {
            return allCoins.filter(el => el.name.toLowerCase().indexOf(query.toLowerCase()) > -1);
        };

        const newArray = (filterItems($("#searchInput").val()));
        $('#coin').empty();
        getList(newArray);

    });

    const coinTemplate = `
        <div class="card">
                <div class="card-body">
                    <h5 class="card-title">{{symbol}}</h5>
                    <p class="card-text">{{name}}</p>
                    <button id="{{id}}" class="btn btn-primary" data-toggle="collapse" data-target="#{{id}}" aria-expanded="false" aria-controls="collapseExample">More Info</button>
                </div>
        </div>
        `

    getData(function (d) {

        getList(d);

    }, 'list');

    $("#moreInfo").click(function (e) {
        e.preventDefault();
        console.log('hh');
    });

    function getList(array) {

        for (let i = 0; i < array.length; i++) {
            buildCoin(array[i]);
        }

    };

    function buildCoin(coin) {

        let template = coinTemplate;
        template = template.replace("{{symbol}}", coin.symbol);
        template = template.replace("{{name}}", coin.name);
        template = template.replace(/{{id}}/g, coin.id);
        $("#coin").append(template);

    };

    const collapseTemplate = `
        <div class="collapse" id="bitcoin">
            <div class="card card-body">
                <img src="{{image}}">
            </div>
        </div>
        `

    function getCoin(coinData) {

        let template = collapseTemplate;
        template = template.replace("{{image}}", coinData.image.large);

        const coin = $('#' + coinData.id);
        (coin.parent().parent()).append(template);
        console.log(coinData);
        console.log(coinData.image.small);
        console.log(coinData.market_data.current_price.usd);
    };

    function getData(callback, toGet) {

        if (toGet === 'list') {
            //let url = 'https://api.coingecko.com/api/v3/coins/list';
            var url = 'demo.json';
        }
        else {
            //var url = 'https://api.coingecko.com/api/v3/coins/' + toGet;
            var url = 'demoB.json';
        }

        $.ajax({
            url: url,
            method: 'GET'
        }).done(function (d) {
            if (typeof d === 'string')
                d = JSON.parse(d);
            allCoins = d;
            callback(d);
            $('#coin>.card>.card-body>button').click(function (e) {
                e.preventDefault();
                getData(function (d) {
                    getCoin(d);
                }, this.id);
            });
        })
    };



    $('#navbarSupportedContent>ul>li>a').click(function (e) {
        e.preventDefault();
        const href = $(this).attr('href');
        $.ajax(`templates/${href}.html`).done(function (htmlContent) {
            $('#main').html(htmlContent);
            getData(function (d) {
                getList(d);
            }, 'list');
        })
    });

})