import injector from './modules';
import IHistoryFlowEntry from './database/model/IHistoryFlowEntry';
import BackgroundApp, { BackgroundPage } from './background';
import Vue = require('vue');

import d3 = require('d3');
import d3Selection = require('d3-selection');

interface Row {
    id: string,
    title: string,
    parent?: string,
    start: number,
    end: number,
}

interface XYCoordinate {
    x: number,
    y: number
}

class Node<T> {
    private _children: Node<T>[] = [];
    constructor(private _id: string, private data: T) {
    }

    insert(parentId: string, node: Node<T>) {
        const parentNode = this.find(parentId) || this;
        parentNode._children.push(node);
    }

    id(): string {
        return this._id;
    }

    value(): T {
        return this.data;
    }

    children(): Node<T>[] {
        return this._children;
    }

    private find(id: string): Node<T> {
        if (this._id === id) {
            return this;
        }

        if (this._children.length === 0) {
            return undefined;
        }

        for (let child of this._children) {
            const found = child.find(id);
            if (found) {
                return found;
            }
        }
    }
}

// function mock<T>(t: any): T {
//     return t as T;
// }

// function inspect(node: Node<HistoryVisitItem>) {
//     const value = node.value();
//     const historyItem = value.getHistoryItem();
//     const visitItem = value.getVisitItem();
//     console.groupCollapsed(`${node.id()} - ${historyItem.title || historyItem.url}`);
//     console.log(historyItem, visitItem);
//     node.children().forEach(child => inspect(child));
//     console.groupEnd();
// }

class App {
    private renderer = new IndexRenderer(document.querySelector("#gantt"), 1000, 275);

    renderData(data: IHistoryFlowEntry[]) {
        const formattedData = data.map(row => {
            return {
                start: row.startedAt,
                end: row.startedAt + row.timeSpent,
                id: row.pageId,
                parent: row.parentPageId,
                title: row.title
            }
        });
        this.renderer.update(formattedData);
    }

    private getBackground() {
        return new Promise<BackgroundPage>((resolve) => {
            chrome.runtime.getBackgroundPage((win) => resolve(win as BackgroundPage));
        });
    }

    private async getBackgroundApp() {
        const background = await this.getBackground();
        return background.app;
    }

    static async main() {
        const app = new App();
        const backgroundApp = await app.getBackgroundApp();
        const entries = await backgroundApp.getHistoryFlowService().getAllEntries();

        app.renderData(entries);

        // const root = new Node("0", new HistoryVisitItem(mock<chrome.history.HistoryItem>({}), mock<chrome.history.VisitItem>({})));

        // app.loadHistoryVisitItems().then(() => {
        //     // const groupByReferringId: Map<string, chrome.history.VisitItem[]> = Array.from(app.visitItemMap.values()).reduce((memo, me) => {
        //     //     const referringVisitId = me.referringVisitId;
        //     //     if (!memo.has(referringVisitId)) {
        //     //         memo.set(referringVisitId, []);
        //     //     }
        //     //     memo.get(referringVisitId).push(me);

        //     //     return memo;
        //     // }, new Map<string, chrome.history.VisitItem[]>());

        //     Array.from(app.visitItemMap.values()).sort((a, b) => {
        //         return parseInt(a.visitId, 10) - parseInt(b.visitId, 10);
        //     }).forEach(visitItem => {
        //         const historyVisitItem = new HistoryVisitItem(app.historyItemMap.get(visitItem.id), visitItem);
        //         root.insert(visitItem.referringVisitId, new Node(visitItem.visitId, historyVisitItem));
        //     });

        //     inspect(root);

        //     // Array.from(groupByReferringId.entries()).forEach(([referringVisitId, visitItems]) => {
        //     //     console.group(referringVisitId);
        //     //     console.table(visitItems);
        //     //     console.groupEnd();
        //     // });
        // });
    }

    // private loadHistoryVisitItems(): Promise<void> {
    //     return this.timerService.run('loadData', () => {
    //         return this.historyService.all().then(historyItems => {
    //             this.historyItemMap = historyItems.reduce((memo, me) => {
    //                 memo.set(me.id, me);
    //                 return memo;
    //             }, new Map<string, chrome.history.HistoryItem>());
    //             return Promise
    //                 .all(historyItems.map(historyItem => {
    //                     return this.historyService.getVisits({ url: historyItem.url });
    //                 }))
    //                 .then((visitResponses) => {
    //                     this.visitItemMap = visitResponses
    //                         .reduce((memo, me) => memo.concat(me), [])
    //                         .reduce((memo, me) => {
    //                             memo.set(me.visitId, me);
    //                             return memo;
    //                         }, new Map<string, chrome.history.VisitItem>());
    //                 });
    //         });
    //     });
    // }
}


class IndexRenderer {
    private svg = d3.select(this.container);
    private directions = this.newGroup();
    private bars = this.newGroup();
    private favicons = this.newGroup();
    private titles = this.newGroup();
    private x: (x: number) => number;
    private line = d3.line<XYCoordinate>().x(d => d.x).y(d => d.y)
    private barConfig = {
        height: 25,
        margin: 5,
        radius: 5
    };
    private faviconConfig = {
        width: 16,
        height: 16,
        margin: 0
    };

    constructor(private container: Element, private width: number, private height: number) {
        this.faviconConfig.margin = (this.barConfig.height - this.faviconConfig.height) / 2;
    }


    update(data: Row[]) {
        const min = d3.min(data.map(d => d.start));
        const max = d3.max(data.map(d => d.end));
        this.x = d3.scaleLinear().domain([min, max]).range([0, this.width]);

        console.log(data, min, max);

        this.updateDirections(data);
        this.updateBars(data)
        this.updateFavicons(data);
        this.updateTitles(data);
    }

    private updateBars(data: Row[]) {
        const rects = this.bars.selectAll("rect")
            .data(data)

        rects.enter().append("rect")
            .attr("x", (d, i) => {
                return this.x(d.start);
            })
            .attr("y", (d, i) => {
                return this.y(i);
            })
            .attr("width", d => {
                return this.x(d.end);
            })
            .attr("height", this.barConfig.height)
            .attr("rx", this.barConfig.radius)
            .attr("ry", this.barConfig.radius)
            .style("fill", this.randomColor());

        rects.exit().remove();
    }

    private updateDirections(data: Row[]) {
        const idMap = data.reduce((memo, me) => memo.set(me.id, me), new Map<String, Row>());
        console.log(idMap.size)
        const dataWithParents = data.filter(d => d.parent && idMap.has(d.parent));
        const paths = this.directions.selectAll("path")
            .data(dataWithParents)

        paths.enter().append("path")
            .attr("d", (d) => {
                const i = data.indexOf(d);
                const parent = idMap.get(d.parent);
                const parentIndex = data.indexOf(parent);
                if (!parent) debugger;
                let startX = d3.mean([parent.start, parent.end]);
                if (startX >= d.start) {
                    startX = d3.mean([parent.start, d.start]);
                }

                return this.line([
                    { x: this.x(startX), y: this.y(parentIndex) + this.barConfig.height - this.barConfig.height * 0.2 },
                    { x: this.x(startX), y: this.y(i) + this.barConfig.height / 2 },
                    { x: this.x(d.start), y: this.y(i) + this.barConfig.height / 2 }
                ])
            })
            .attr("stroke", "black")
            .attr("stroke-width", "1.4")
            .attr("fill", "none");

        paths.exit().remove();
    }

    private updateFavicons(data: Row[]) {
        const images = this.favicons.selectAll("image")
            .data(data)

        images.enter().append("image")
            .attr("x", (d, i) => {
                return this.x(d.start) + this.faviconConfig.margin;
            })
            .attr("y", (d, i) => {
                return this.y(i) + this.faviconConfig.margin;
            })
            .attr("width", this.faviconConfig.width)
            .attr("height", this.faviconConfig.height)
            .attr("xlink:href", "https://www.google.com/favicon.ico");

        images.exit().remove();
    }

    private updateTitles(data: Row[]) {
        const texts = this.titles.selectAll("text")
            .data(data)

        texts.enter().append("text")
            .attr("x", (d, i) => {
                return this.x(d.start) + (this.faviconConfig.margin * 2) + this.faviconConfig.width;
            })
            .attr("y", (d, i) => {
                return this.y(i) + this.faviconConfig.margin + this.barConfig.height / 2;
            })
            .text((d) => d.title)

        texts.exit().remove();
    }

    private randomColor() {
        return "hsl(" + Math.floor(Math.random() * 360) + ",89%,67%)";
    }

    private y(index: number): number {
        return (this.barConfig.height + this.barConfig.margin) * index;;
    }

    private newGroup() {
        return this.svg.append('g');
    }
}

App.main();