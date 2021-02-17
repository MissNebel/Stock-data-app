
import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { BLOCK_MARKER } from '@angular/localize/src/utils';
import { NgbDate, NgbCalendar, NgbDateParserFormatter } from '@ng-bootstrap/ng-bootstrap';
import { Papa } from 'ngx-papaparse';
import { element } from 'protractor';
import { from } from 'rxjs';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {

  constructor(private papa: Papa, private http: HttpClient, private calendar: NgbCalendar, public formatter: NgbDateParserFormatter) { }
  title = 'stock-data-app';
  active = 1;


  fileData: any[] = [];
  dataArray: any[] = [];
  dateArray: any[] = [];
  filteredDataArray: any[] = [];
  highestVolumeList: any[] = [];

  longestBullish: any[] = [];
  firstDay;
  lastDay;

  startingDate = '';
  endingDate = '';

  hoveredDate: NgbDate | null = null;

  fromDate: NgbDate | null;
  toDate: NgbDate | null;

  readFile(): any {
    this.http.get('./assets/HistoricalQuotes.csv', { responseType: 'text' })
      .subscribe(data => {
        data.split(/[\r\n]+/).forEach(line => {
          this.papa.parse(line, {
            header: true,
            complete: (result) => {
              this.fileData.push(line);
            }
          });

        });
        for (let i = 1; i < this.fileData.length; i++) {
          const a = (this.fileData[i]).split(',');
          const stockData: StockData = new StockData();
          stockData.date = a[0].trim();
          stockData.closeLast = parseFloat(a[1].trim().replace(/[^\d.-]/g, ''));
          stockData.volume = parseFloat(a[2].trim().replace(/[^\d.-]/g, ''));
          stockData.open = parseFloat(a[3].trim().replace(/[^\d.-]/g, ''));
          stockData.high = parseFloat(a[4].trim().replace(/[^\d.-]/g, ''));
          stockData.low = parseFloat(a[5].trim().replace(/[^\d.-]/g, ''));
          this.dataArray.push(stockData);
        }
      });

  }

  calcDays(start, end): any {
    const date1 = new Date(start);
    const date2 = new Date(end);
    const newDate = date1;

    while (newDate <= date2) {
      const x = newDate.toLocaleString().split(/\D/).slice(0, 3).map(num => num.padStart(2, '0')).join('/');
      this.dateArray.push(x);
      newDate.setDate(newDate.getDate() + 1);
    }
    this.getLongestBullish(this.dataArray, this.dateArray);
  }

  getLongestBullish(dataArray, dateArray): any {
    const bullish = [];
    const arr = [];
    let arr2 = [];
    this.filteredDataArray = dataArray.filter(dataItem => dateArray.includes(dataItem.date)).reverse();

    // tslint:disable-next-line:prefer-for-of
    for (let i = 0; i < this.filteredDataArray.length; i++) {
      console.log(this.filteredDataArray[i].date);
      if (arr.length === 0) {
        arr.push(this.filteredDataArray[i]);
      }
      // tslint:disable-next-line:max-line-length
      else if (this.filteredDataArray[i].closeLast < this.filteredDataArray[i - 1].closeLast || i === this.filteredDataArray.length - 1) {
        if (i === this.filteredDataArray.length - 1) {
          arr.push(this.filteredDataArray[i]);
        }
        arr2 = [...arr];
        bullish.push(arr2);
        arr.length = 0;
        arr.push(this.filteredDataArray[i]);
      }
      else if (this.filteredDataArray[i].closeLast > this.filteredDataArray[i - 1].closeLast) {
        arr.push(this.filteredDataArray[i]);
      }
    }
    const lengths = bullish.map(a => a.length);
    lengths.indexOf(Math.max(...lengths));
    let largest = lengths[0];

    // tslint:disable-next-line:prefer-for-of
    for (let i = 0; i < lengths.length; i++) {
      if (largest < lengths[i]) {
        largest = lengths[i];
      }
      this.longestBullish = bullish[i];
    }
    this.firstDay = this.longestBullish[0];
    this.lastDay = this.longestBullish[this.longestBullish.length - 1];
    this.getHighestVolume();
  }

  getHighestVolume(): any {
    this.highestVolumeList = this.filteredDataArray.sort((a, b) => (a.volume < b.volume ? 1 : -1));
    let diff;
    // tslint:disable-next-line:prefer-for-of
    for (let i = 0; i < this.highestVolumeList.length; i++) {
      // tslint:disable-next-line:typedef
      function difference(a, b) {
        return Math.abs(a - b);
      }
      diff = difference(this.highestVolumeList[i].high, this.highestVolumeList[i].low);
      this.highestVolumeList[i].difference = diff;
      console.log('volume');
      // tslint:disable-next-line:no-shadowed-variable
      this.highestVolumeList.forEach(element => {
        console.log(element);
      });
    }
  }

  getDates(fromDate, toDate): any {
    this.startingDate = '"' + fromDate.year + '-' + fromDate.month + '-' + fromDate.day + '"';
    this.endingDate = '"' + toDate.year + '-' + toDate.month + '-' + toDate.day + '"';
    this.calcDays(this.startingDate, this.endingDate);
  }

  // Bootstrap kalenteri
  onDateSelection(date: NgbDate): any {
    if (!this.fromDate && !this.toDate) {
      this.fromDate = date;
    } else if (this.fromDate && !this.toDate && date && date.after(this.fromDate)) {
      this.toDate = date;
    } else {
      this.toDate = null;
      this.fromDate = date;
    }
    this.getDates(this.fromDate, this.toDate);
  }
  // Bootstrap kalenteri
  // tslint:disable-next-line:typedef
  isHovered(date: NgbDate) {
    return this.fromDate && !this.toDate && this.hoveredDate && date.after(this.fromDate) && date.before(this.hoveredDate);
  }
  // Bootstrap kalenteri
  // tslint:disable-next-line:typedef
  isInside(date: NgbDate) {
    return this.toDate && date.after(this.fromDate) && date.before(this.toDate);
  }
  // Bootstrap kalenteri
  // tslint:disable-next-line:typedef
  isRange(date: NgbDate) {
    return date.equals(this.fromDate) || (this.toDate && date.equals(this.toDate)) || this.isInside(date) || this.isHovered(date);
  }
  // Bootstrap kalenteri
  validateInput(currentValue: NgbDate | null, input: string): NgbDate | null {
    const parsed = this.formatter.parse(input);
    return parsed && this.calendar.isValid(NgbDate.from(parsed)) ? NgbDate.from(parsed) : currentValue;
  }


  ngOnInit(): any {
    this.readFile();
  }

}

export class StockData {
  date: string;
  closeLast: number;
  volume: number;
  open: number;
  high: number;
  low: number;
  difference: number;

}
