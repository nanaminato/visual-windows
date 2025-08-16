import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';

@Injectable({
    providedIn: 'root',
})
export class FileServerService{
    private baseUrl = '/api/v1/FileSystem';
    constructor(private http: HttpClient) { }

}
