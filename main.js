$(document).ready(function () {

    var arrayObjectsData = [];

    function getData(callback, toGet) {

        if (toGet === 'allCoins') {
            var url = 'https://api.coingecko.com/api/v3/coins/list';
            //var url = 'demo.json';
        }
        else if (Array.isArray(toGet)) {
            let coins = (toGet.join()).toUpperCase();  //   Get all the coins from the array and convert them into one string in capital letters. 
            coins = coins.replace(/COIN-/g, '');    //   Delete from the array prefix that not needed..
            var url = 'https://min-api.cryptocompare.com/data/pricemulti?fsyms=' + coins + '&tsyms=USD';
        }
        else {     //    The variable that passed is 'id'
            var url = 'https://api.coingecko.com/api/v3/coins/' + toGet;
            //var url = 'demoB.json';
        };

        $.ajax({
            url: url,
            method: 'GET'
        }).done(function (d) {
            if (typeof d === 'string')
                d = JSON.parse(d);
            callback(d);
            if (toGet === 'allCoins') {
                const index = arrayObjectsData.findIndex(x => x.coinId === 'allCoins');
                if (index != -1) {
                    arrayObjectsData[index].content = d;
                    arrayObjectsData[index].lastClick = new Date().getTime();
                }
                else
                    arrayObjectsData.push({ lastClick: new Date().getTime(), coinId: 'allCoins', content: d });
            };
        });
    };

    function getWithAjax(toGet) {

        getData(function (d) {
            if (toGet === 'allCoins')
                getList(d);
            else if (Array.isArray(toGet))
                getReports(d);
            else
                getCollapse(d);
        }, toGet);
    };

    getWithAjax('allCoins');     //   Get all coins when the page loaded

    $("#searchButton").click(function (e) {

        e.preventDefault();
        const allCoins = arrayObjectsData.find(x => x.coinId === "allCoins");   

        //  Search for all matches:
        /*
     const filterCoins = (query) => {
         return allCoins.content.filter(coin => coin.symbol.toLowerCase().indexOf(query.toLowerCase()) > -1);
     };
     const filterCoinsArray = (filterCoins($("#searchInput").val()));
     $('#coin').empty();
     getList(filterCoinsArray);
     coinClick();
        */

        //  Search for exact symbol:
        const coin = allCoins.content.find(x => x.symbol === $("#searchInput").val().toLowerCase());   //  The symbol of the coin is in lowercase, so for the search work well we will lower the letters
        if (coin) {
            $('#coin').empty();
            buildCoin(coin);
            coinClick();
            switchButton();
        }
        else
            alert('The coin not found!, Try again!');
        $("#searchInput").val('');   //   Clean the input  
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
                        <input type="checkbox" class="default" id="coin-{{symbol}}">
                        <span class="slider round"></span>
                    </label>
                </div>
            </div>
            <div class="collapse" id="collapse-{{id}}">
                <div class="card card-body" id="collapse-content-{{id}}">
                </div>
            </div>
        </div>
    `;

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
        keepToggleButton();    //    Activates a function that maintains the status of the toggele buttons.
        coinClick();
        switchButton();   //    After 'keepToggleButton' function, need to activate this function, to listen to clicks on the switch Button.
        $("#searchForm").prop('hidden', false);    //   Show the search option in the list.
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
    `;

    function getCollapse(coinData) {

        let template = collapseTemplate;
        template = template.replace("{{$}}", coinData.market_data.current_price.usd);
        template = template.replace("{{€}}", coinData.market_data.current_price.eur);
        template = template.replace("{{₪}}", coinData.market_data.current_price.ils);
        template = template.replace("{{image}}", coinData.image.small);

        const index = arrayObjectsData.findIndex(x => x.coinId === coinData.id);
        arrayObjectsData[index].content = template;   //  Save for the cache

        const coin = $('#collapse-content-' + coinData.id);
        coin.append(template);
    };

    function coinClick() {

        $('#coin>.card>.card-body button').click(function (e) {
            e.preventDefault();
            const id = this.id;
            const collapseStatus = buttonName(id);   //   Change the text on the button and return the status of the collapse
            if (collapseStatus === 'false') {
                const lastClick = new Date().getTime();
                const index = arrayObjectsData.findIndex(coin => coin.coinId === id);   //   Check if the data of the coin exists in the array
                if (index == -1) {
                    arrayObjectsData.push({
                        lastClick: lastClick,
                        coinId: id
                    });
                    getWithAjax(id);
                }
                else {
                    cleanCoin(id);
                    const result = checkTime(id, 10);    //   Checks whether to get the content from the server or from the cache, according to the time passed from the last call (time is sent as a parameter in seconds)
                    getContent(result, id);
                };
            };
        });
    };

    function buttonName(id) {

        const isExpanded = $('#' + id).attr("aria-expanded");
        switch (isExpanded) {
            case 'false':
                $('#' + id).text('Close');
                break;
            case 'true':
                $('#' + id).text('More Info');
                break;
        };
        return isExpanded;
    };

    function cleanCoin(coinToClean) {

        const coin = $('#collapse-content-' + coinToClean);
        coin.empty();   //    Delite the old data before get the new data
    };

    function checkTime(key, timeInSeconds) {

        const timeNow = new Date().getTime();
        const object = arrayObjectsData.find(array => array.coinId === key);
        const difference = timeNow - object.lastClick;
        if (difference / 1000 > timeInSeconds)
            return 'ajax';
        else
            return 'cache';
    };

    function getContent(from, toGet) {

        const index = arrayObjectsData.findIndex(x => x.coinId === toGet);
        if (from === 'ajax') {
            getWithAjax(toGet);
            arrayObjectsData[index].lastClick = new Date().getTime();  //   Updating the last click
        }
        else 
            getFromCache(toGet, index);
    };

    function getFromCache(toGet, index) {
        if (toGet === 'allCoins')
            getList(arrayObjectsData[index].content);
        else {
            const coin = $('#collapse-content-' + toGet);
            coin.append(arrayObjectsData[index].content);
        };
    };

    var switchArray = [];

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
                switchArray.splice($.inArray(this.id, switchArray), 1);
        });
    };

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
            <button onclick="window.close()" id="removeCoinButton">Remove</button>
            <button onclick="window.close()">Cancle</button>
        </form>
        `;

    function openWindow(coinToAdd) {

        let template = templateWindow;
        template = template.replace(/{{coin1}}/g, switchArray[0]);
        template = template.replace(/{{coin2}}/g, switchArray[1]);
        template = template.replace(/{{coin3}}/g, switchArray[2]);
        template = template.replace(/{{coin4}}/g, switchArray[3]);
        template = template.replace(/{{coin5}}/g, switchArray[4]);

        const myWindow = window.open("", "MsgWindow", "width=400, height=300, top=300, left=300");
        myWindow.document.write(template);

        const removeWindow = $(myWindow.document.body);
        removeWindow.find("#removeCoinButton").click(function (e) {
            e.preventDefault();
            const coinToRemove = removeWindow.find('input[name=report]:checked', '#Form').val();
            switchArray.splice($.inArray(coinToRemove, switchArray), 1);
            switchArray.push(coinToAdd);
            $('#' + coinToRemove).click();   //   To cancel the previous click on the screen.
            switchArray.push(coinToAdd);  //  The click in the previous row delete the latest from the array, so we need to add him another time! 
        });
    };

    function keepToggleButton() {
        if (switchArray) {
            for (let i = 0; i < switchArray.length; i++) {
                $('#' + (switchArray[i].toLowerCase())).click();
            };
        };
    };

    var interval;

    $('#navbarSupportedContent>ul>li>a').click(function (e) {
        e.preventDefault();
        if (interval)    //   If 'interval' exists, then switching to another page, should stop it.
            clearInterval(interval);
        const href = $(this).attr('href');
        $.ajax(`templates/${href}.html`).done(function (htmlContent) {
            $('#main').html(htmlContent);
            if (href === 'home') {
                const result = checkTime('allCoins', 20);   //   Checks whether to get the content from the server or from the cache, according to the time passed from the last call (time is sent as a parameter in seconds)
                getContent(result, 'allCoins');
            }
            else {
                $("#searchForm").prop('hidden', 'hidden');   //   Hide search option from the page
                if (href === 'reports')
                    reportPage();
            };
        });
    });

    function reportPage() {

        if (switchArray.length == 0) {
            alert('There are no coins to display!');
            $("a[href='home']").click();    //   Return to home page
        }
        else {
            interval = setInterval(function () {
                getWithAjax(switchArray);
            }, 2000);
        };
    }

});