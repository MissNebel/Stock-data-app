import { HttpClient } from '@angular/common/http';

export class DataService {

    data: 'assets/HistoricalQuotes.csv';

    constructor(private http: HttpClient) { }

    // tslint:disable-next-line:typedef
    getInfo() {

    return this.http.get(this.data, {responseType: 'text'});

    }

}
