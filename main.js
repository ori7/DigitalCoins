$(document).ready(function () {

    getWithAjax('firstList');

    $("#searchButton").click(function (e) {

        e.preventDefault();
        const filterItems = (query) => {
            return allCoins.filter(el => el.name.toLowerCase().indexOf(query.toLowerCase()) > -1);
        };
        const newArray = (filterItems($("#searchInput").val()));
        $('#coin').empty();
        getList(newArray);
        coinClick();
    });

    const coinTemplate = `
        <div class="card">
                <div class="card-body">
                    <h5 class="card-title">{{symbol}}</h5>
                    <p class="card-text">{{name}}</p>
                    <button id="{{id}}" class="btn btn-primary" data-toggle="collapse" data-target="#collapse-{{id}}" aria-expanded="false" aria-controls="collapseExample">More Info</button>
                </div>
            <div class="collapse" id="collapse-{{id}}">
                <div class="card card-body" id="collapse-content-{{id}}"></div>
            </div>
        </div>
    `

    function buildCoin(coin) {

        let template = coinTemplate;
        template = template.replace("{{symbol}}", coin.symbol);
        template = template.replace("{{name}}", coin.name);
        template = template.replace(/{{id}}/g, coin.id);
        $("#coin").append(template);
    };

    function getList(array) {

        for (let i = 0; i < array.length; i++) {
            buildCoin(array[i]);
        }
    };

    const collapseTemplate = `
        <div class="row">
            <div class="col-sm-9 font-weight-bold">
                <div>{{$}} $</div>
                <div>{{€}} €</div>
                <div>{{₪}} ₪</div>
            </div>
            <div class="col-sm-3">
                <img src="{{image}}">
            </div>
        </div>
    `

    function getCoin(coinData) {

        let template = collapseTemplate;
        template = template.replace("{{$}}", coinData.market_data.current_price.usd);
        template = template.replace("{{€}}", coinData.market_data.current_price.eur);
        template = template.replace("{{₪}}", coinData.market_data.current_price.ils);
        template = template.replace("{{image}}", coinData.image.small);

        const coin = $('#collapse-content-' + coinData.id);
        coin.empty();
        coin.append(template);
    };

    var allCoins = [];

    function getData(callback, toGet) {

        if (toGet === 'firstList' || toGet === 'list') {
            var url = 'https://api.coingecko.com/api/v3/coins/list';
            //var url = 'demo.json';
        }
        else {
            var url = 'https://api.coingecko.com/api/v3/coins/' + toGet;
            //var url = 'demoB.json';
        }

        $.ajax({
            url: url,
            method: 'GET'
        }).done(function (d) {
            if (typeof d === 'string')
                d = JSON.parse(d);
            if (toGet === 'firstList')
                allCoins = d;
            callback(d);
            coinClick();
        });
    };

    var times = [];

    function coinClick() {

        $('#coin>.card>.card-body>button').click(function (e) {
            e.preventDefault();
            const id = this.id;
            const lastClick = (new Date()).getTime();
            const index = times.findIndex(coin => coin.coinId === id);
            if (index == -1) {
                getWithAjax(id);
                times.push({
                    lastClick: lastClick,
                    coinId: id
                });
            }
            else {
                if ((lastClick - times[index].lastClick) / 1000 > 10)  // pass 10 second
                    getWithAjax(id);
                times[index].lastClick = lastClick;
            };
            buttonName(id);
        });
    };

    function getWithAjax(toGet) {

        getData(function (d) {
            if (toGet === 'firstList' || toGet === 'list')
                getList(d);
            else
                getCoin(d);
        }, toGet);
    }

    function buttonName(id) {

        var isExpanded = $('#' + id).attr("aria-expanded");
        switch (isExpanded) {
            case 'false':
                $('#' + id).text('Close');
                break;
            case 'true':
                $('#' + id).text('More Info');
                break;
        };
    };

    $('#navbarSupportedContent>ul>li>a').click(function (e) {

        e.preventDefault();
        const href = $(this).attr('href');
        $.ajax(`templates/${href}.html`).done(function (htmlContent) {
            $('#main').html(htmlContent);
            getWithAjax('list');
        });
    });
});