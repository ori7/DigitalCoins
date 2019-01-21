$(document).ready(function () {

    $("#searchButton").click(function (e) {

        e.preventDefault();
        newArray = [allCoins].filter(function (coin) { return coin.match($("#searchInput").val) }); console.log(newArray);
        getList(newArray);
    });

    const coinTemplate = `
        <div class="card" style="width: 18rem;">
                <div class="card-body">
                    <h5 class="card-title">{{symbol}}</h5>
                    <p class="card-text">{{name}}</p>
                    <button id="moreInfo" class="btn btn-primary">More Info</button>
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
        $("#coin").append(template);

    };

    function getData(callback, toGet) {

        if (toGet === 'list') {
            //let url = 'https://api.coingecko.com/api/v3/coins/list';
            var url = 'demo.json';
        }
        else{};

        $.ajax({
            url: url,
            method: 'GET'
        }).done(function (d) {
            if (typeof d === 'string')
                d = JSON.parse(d);
            callback(d);
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