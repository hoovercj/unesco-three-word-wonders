function UnescoSite(site) {
	var self = this;	
	self.name = site['name_en'];
    self.description = site['short_description_en'];
    self.latitude = site.latitude;
    self.longitude = site.longitude;
    self.state = site['states_name_en'];
    self.threeWords = ko.observable();
    self.threeWordsURL = ko.computed(function () {
        return "http://w3w.co/" + self.threeWords();
    });
}

var ViewModel = function() {
	var self = this;
    self.searchTerm = ko.observable();
	self.photos = ko.observableArray([]);
    self.unescoSites = ko.observableArray([]);
    self.activeSite = ko.observable();

    $.getJSON('js/unesco.json', function (data) {
        self.unescoSites(data.map( function (site) {
            return new UnescoSite(site);
        }));
        
        self.activateRandomSite();
    });

    function getUrlFromPhoto (photo) {
        return 'https://farm' + photo.farm + '.staticflickr.com/' + photo.server + '/' + photo.id + '_' + photo.secret + '_n.jpg';
    }

    self.activateRandomSite = function () {
        var randomIndex = Math.floor((Math.random() * self.unescoSites().length) + 1);
        console.log('Activate Random Site: ' + randomIndex);
        //console.dir(self.unescoSites()[randomIndex]);
        self.activeSite(self.unescoSites()[randomIndex]);
        self.queryFlickr();
        if (!self.activeSite().threeWords() || self.activeSite().threeWords().length === 0) {
            var position = [self.activeSite().latitude, self.activeSite().longitude];
            What3words.positionToWords(position, function (ret) {
                console.log(ret);
                self.activeSite().threeWords(ret);
            });
        }
    }

    self.queryFlickr = function () {
        var flickrURL = 'https://api.flickr.com/services/rest';
        var params = { 
            'api_key':'0fb57b23161e29d12733e2d491969b93',
            'text': self.activeSite().name,
            // 'is_commons': true,
            'sort': 'interestingness-desc',
            'license':'1,2,3,4,5,6,6,7,8',
            // 'safe_search':'1',
            // 'content_type':'1',
            'per_page':'8',
            'method':'flickr.photos.search',
            'format':'json',
            'nojsoncallback':'1'
        };
        $.get( flickrURL, params, function (data) {
            if(data.stat === 'ok') {
                self.photos(data.photos.photo.map(getUrlFromPhoto));
            } else {
                console.log('error');
            }            
        });
    }
}

var viewModel = new ViewModel();
ko.applyBindings(viewModel);