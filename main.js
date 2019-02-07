$(document).ready(function () {

    getWithAjax('allCoins');     //   Get all coins when the page loaded

    var arrayObjectsData = [];    //   This variable is designed to store all data (cache)

    function getData(callback, toGet) {

        const url = buildUrl(toGet);

        $.ajax({
            url: url,
            method: 'GET'
        }).done(function (d) {
            if (typeof d === 'string')
                d = JSON.parse(d);
            callback(d);
            if (!Array.isArray(toGet)) {
                saveForCache(toGet, d);
            };
        });
    };

    function buildUrl(toGet) {

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
        return url;
    };

    function saveForCache(id, object) {

        const index = arrayObjectsData.findIndex(x => x.coinId === id);
        if (index != -1) {   //   The object 'allCoins' already exists, so we need only update it
            arrayObjectsData[index].content = object;
            arrayObjectsData[index].lastClick = new Date().getTime();
        }
        else    //   The object 'allCoins' does not exist yet, so we need to create it. 
            arrayObjectsData.push({ lastClick: new Date().getTime(), coinId: id, content: object });
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

    $("#searchButton").click(function (e) {

        e.preventDefault();
        const allCoinsArray = arrayObjectsData.find(x => x.coinId === "allCoins");

        //  Search for all matches:
        /*
    const filterCoins = (query) => {
        return allCoinsArray.content.filter(coin => coin.symbol.toLowerCase().indexOf(query.toLowerCase()) > -1);
    };
    const filterCoinsArray = (filterCoins($("#searchInput").val()));
    $('#coin').empty();
    getList(filterCoinsArray);
    coinClick();
        */

        //  Search for exact symbol:
        const coin = allCoinsArray.content.find(x => x.symbol === $("#searchInput").val().toLowerCase());   //  The symbol of the coin is in lowercase, so for the search work well we will lower the letters
        if (coin) {
            $('#coin').empty();    //   Empty the screen before bringing the requested coin
            buildCoin(coin);    //   After 'buildCoin', we need to activate these functions:
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
                <div class="card card-body" id="collapse-content-{{id}}"></div>                
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
        coinClick();      //    Activate function that listen to click on the buttons 'More Info' in the cards.
        switchButton();   //    After 'keepToggleButton' function, need to activate this function, to listen to clicks on the switch Button.
        $("#searchForm").prop('hidden', false);    //   Show the search option in the list.
        $('#main>.midlle').remove();     //     Stop the animation of 'loading'.
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

        loaderCollapse('remove', coinData.id);   //   Remove the animation of loading before append the content of the collapse.
        const coin = $('#collapse-content-' + coinData.id);
        coin.append(template);
    };

    function coinClick() {

        $('#coin>.card>.card-body button').click(function (e) {

            e.preventDefault();
            const id = this.id;
            const collapseStatus = buttonName(id);   //   Change the text on the button and return the status of the collapse.
            if (collapseStatus === 'false') {
                loaderCollapse('add', id);   //   Add animation of loading until the content get
                const index = arrayObjectsData.findIndex(coin => coin.coinId === id);   //   Check if the data of the coin exists in the array.
                if (index === -1)
                    getWithAjax(id);
                else {
                    cleanCoin(id);
                    const result = checkTime(id, 2 * 60);    //   Checks whether to get the content from the server or from the cache, according to the time passed from the last call (time is sent as a parameter in seconds).
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
        coin.empty();   //    Delite the old data before get the new data.
    };

    function loaderCollapse(act, id) {

        switch (act) {
            case 'add':
                $('#collapse-' + id).parent().append('<div class="loaderCollapse mx-auto"></div>');
                break;
            case 'remove':
                $('#collapse-' + id).parent().children().last().remove();
                break;
        };
    };

    function checkTime(element, timeInSeconds) {

        const timeNow = new Date().getTime();
        const object = arrayObjectsData.find(array => array.coinId === element);
        const difference = (timeNow - object.lastClick) / 1000;   //   The times are in milliseconds, so if we multiply by 1000 we will get it in seconds.
        if (difference > timeInSeconds)
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
        else
            getCollapse(arrayObjectsData[index].content);
    };

    var switchArray = [];

    function switchButton() {

        $('#coin>.card>.card-body .switch>.default').change(function (e) {
            e.preventDefault();
            if (this.checked) {
                switchArray.push(this.id);
                if (switchArray.length > 5)
                    openWindow(this.id); console.log(switchArray);
            }
            else
                switchArray.splice($.inArray(this.id, switchArray), 1);
        });
    };

    function openWindow(coinToAdd) {

        const template = buildTemplateWindow();
        const myWindow = window.open("", "MsgWindow", "width=400, height=300, top=300, left=300");
        myWindow.document.write(template);

        const windowBody = $(myWindow.document.body);
        windowBody.find("#removeCoinButton").click(function (e) {
            e.preventDefault();
            const coinToRemove = windowBody.find('input[name=report]:checked', '#Form').val();
            arrangeSwitchArray(coinToRemove, coinToAdd); console.log(switchArray);
        });
    };

    function buildTemplateWindow() {

        let templateWindow = `
            <form class="container" id="form">
                <h3>You have too much coins reports, remove one!</h3>`;
        for (let i = 0; i < switchArray.length-1; i++) {
            let templateCoin = `
                <div class="form-check">
                    <input class="form-check-input" type="radio" name="report" id="r-{{coin}}" value="{{coin}}">
                    <label class="form-check-label" for="r-{{coin}}">Remove {{coin}}</label>
                    <br><br>
                </div>`;
            templateCoin = templateCoin.replace(/{{coin}}/g, switchArray[i]);
            templateWindow += templateCoin;
        };
        templateWindow += `
                <button onclick="window.close()" id="removeCoinButton">Remove</button>
                <button onclick="window.close()">Cancle</button>
            </form>`;
        return templateWindow;
    };

    function arrangeSwitchArray(coinToRemove, coinToAdd) {

       
        //switchArray.push(coinToAdd);
        $('#' + coinToRemove).click();   //   To cancel the previous click on the screen.
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
                parallax('add');
                const result = checkTime('allCoins', 60);   //   Checks whether to get the content from the server or from the cache, according to the time passed from the last call (time is sent as a parameter in seconds)
                getContent(result, 'allCoins');
            }
            else {
                $("#searchForm").prop('hidden', 'hidden');   //   Hide search option from the page
                parallax('remove');
                if (href === 'reports')
                    reportPage();
            };
        });
    });

    function parallax(act) {

        switch (act) {
            case 'add':
                $(".optionParallax").addClass('parallax');
                break;
            case 'remove':
                $(".optionParallax").removeClass('parallax');
                break;
        };
    }

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