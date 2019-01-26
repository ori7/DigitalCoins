$(document).ready(function () {

    getWithAjax('list');

    $("#searchButton").click(function (e) {

        e.preventDefault();
        //  Search for all matches:
        /*      
        const filterCoins = (query) => {
            return allCoins.filter(coin => coin.symbol.toLowerCase().indexOf(query.toLowerCase()) > -1);
        };
        const filterCoinsArray = (filterCoins($("#searchInput").val()));
        $('#coin').empty();
        getList(filterCoinsArray);
        coinClick();
        */

        //  Search for exact symbol:
        const coin = allCoins.find(x => x.symbol === $("#searchInput").val().toLowerCase());
        if (coin) {
            $('#coin').empty();
            buildCoin(coin);
            coinClick();
            switchButton();
        }
        else
            alert('The coin not found!, Try again!');
        $("#searchInput").val('');

    });

    const coinTemplate = `
        <div class="card">
            <div class="card-body row">
                <div class="col-sm-8">
                    <h5 class="card-title">{{symbol}}</h5>
                    <p class="card-text">{{name}}</p>
                    <button id="{{id}}" class="btn btn-primary" data-toggle="collapse" data-target="#collapse-{{id}}" aria-expanded="false" aria-controls="collapseExample">More Info</button>            
                </div>
                <div class="col-sm-4">
                    <label class="switch">
                        <input type="checkbox" class="default" id="{{symbol}}">
                        <span class="slider round"></span>
                    </label>
                </div>
            </div>
            <div class="collapse" id="collapse-{{id}}">
                <div class="card card-body" id="collapse-content-{{id}}">
                </div>
            </div>
        </div>
    `

    function buildCoin(coin) {

        let template = coinTemplate;
        template = template.replace(/{{symbol}}/g, coin.symbol);
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

        if (toGet === 'list') {
            //var url = 'https://api.coingecko.com/api/v3/coins/list';
            var url = 'demo.json';
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
            if (toGet === 'list')
                allCoins = d;
            callback(d);
            coinClick();
            switchButton();
        });
    };

    var times = [];

    function coinClick() {

        $('#coin>.card>.card-body button').click(function (e) {
            e.preventDefault(); console.log(this);
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
            if (toGet === 'list')
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

    let switchArray = [];

    function switchButton() {

        $('#coin>.card>.card-body .switch>.default').change(function (e) {
            e.preventDefault();
            if (this.checked) {
                if (switchArray.length < 5) 
                    switchArray.push(this.id);
                else 
                    openWindow(this.id);
            }
            else 
                switchArray.splice( $.inArray(this.id, switchArray), 1 );
        });
    }

    const templateWindow = `
        <form class="container" id="form">
            <p>You have too much coins reports, remove one!</p>
            <div class="form-check">
                <input class="form-check-input" type="radio" name="report" id="report1" value="{{coin1}}">
                <label class="form-check-label" for="report1">Remove {{coin1}}</label>
            </div>
            <div class="form-check">
                <input class="form-check-input" type="radio" name="report" id="report2" value="{{coin2}}">
                <label class="form-check-label" for="report2">Remove {{coin2}}</label>
            </div>
            <div class="form-check">
                <input class="form-check-input" type="radio" name="report" id="report3" value="{{coin3}}">
                <label class="form-check-label" for="report3">Remove {{coin3}}</label>
            </div>
            <div class="form-check">
                <input class="form-check-input" type="radio" name="report" id="report4" value="{{coin4}}">
                <label class="form-check-label" for="report4">Remove {{coin4}}</label>
            </div>
            <div class="form-check">
                <input class="form-check-input" type="radio" name="report" id="report5" value="{{coin5}}">
                <label class="form-check-label" for="report5">Remove {{coin5}}</label>
            </div>
            <button onclick="window.close()" id="removeButton">Remove</button>
            <button onclick="window.close()">Cancle</button>
        </form>
        `

    function openWindow(coinToAdd) {

        let template = templateWindow;
        template = template.replace(/{{coin1}}/g, switchArray[0]);
        template = template.replace(/{{coin2}}/g, switchArray[1]);
        template = template.replace(/{{coin3}}/g, switchArray[2]);
        template = template.replace(/{{coin4}}/g, switchArray[3]);
        template = template.replace(/{{coin5}}/g, switchArray[4]);

        const myWindow = window.open("", "MsgWindow", "width=400, height=300, top=300, left=300");
        myWindow.document.write(template);
        const $w = $(myWindow.document.body);
        $w.find("#removeButton").click(function (e) {
            e.preventDefault();
            const coinRemove = $w.find('input[name=report]:checked', '#Form').val();
            switchArray.splice( $.inArray(coinRemove, switchArray), 1 );
            switchArray.push(coinToAdd);
            console.log(switchArray);
        });
    }

    $('#navbarSupportedContent>ul>li>a').click(function (e) {

        e.preventDefault();
        const href = $(this).attr('href');
        $.ajax(`templates/${href}.html`).done(function (htmlContent) {
            $('#main').html(htmlContent);
            getWithAjax('list');
        });
    });
});