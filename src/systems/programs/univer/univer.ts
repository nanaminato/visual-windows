import {Component, ElementRef, ViewChild} from '@angular/core';
import { LocaleType, mergeLocales, Univer, UniverInstanceType } from '@univerjs/core'
import DesignZhCN from '@univerjs/design/locale/zh-CN'
import { UniverDocsPlugin } from '@univerjs/docs'
import { UniverDocsUIPlugin } from '@univerjs/docs-ui'
import DocsUIZhCN from '@univerjs/docs-ui/locale/zh-CN'
import { UniverFormulaEnginePlugin } from '@univerjs/engine-formula'
import { UniverRenderEnginePlugin } from '@univerjs/engine-render'
import { UniverSheetsPlugin } from '@univerjs/sheets'
import { UniverSheetsFormulaUIPlugin } from '@univerjs/sheets-formula-ui'
import SheetsFormulaUIZhCN from '@univerjs/sheets-formula-ui/locale/zh-CN'
import { UniverSheetsNumfmtUIPlugin } from '@univerjs/sheets-numfmt-ui'
import SheetsNumfmtUIZhCN from '@univerjs/sheets-numfmt-ui/locale/zh-CN'
import { UniverSheetsUIPlugin } from '@univerjs/sheets-ui'
import SheetsUIZhCN from '@univerjs/sheets-ui/locale/zh-CN'
import SheetsZhCN from '@univerjs/sheets/locale/zh-CN'
import { UniverUIPlugin } from '@univerjs/ui'
import UIZhCN from '@univerjs/ui/locale/zh-CN'

import '@univerjs/design/lib/index.css'
import '@univerjs/ui/lib/index.css'
import '@univerjs/docs-ui/lib/index.css'
import '@univerjs/sheets-ui/lib/index.css'
import '@univerjs/sheets-formula-ui/lib/index.css'
import '@univerjs/sheets-numfmt-ui/lib/index.css'
import '@univerjs/engine-formula/facade'
import '@univerjs/ui/facade'
import '@univerjs/docs-ui/facade'
import '@univerjs/sheets/facade'
import '@univerjs/sheets-ui/facade'
import '@univerjs/sheets-formula/facade'
import '@univerjs/sheets-numfmt/facade'
import type { IWorkbookData } from '@univerjs/core'
@Component({
  selector: 'app-univer',
  imports: [],
  templateUrl: './univer.html',
  styleUrl: './univer.css'
})
export class UniverComponent {
    @ViewChild('spreadContainer', { static: true }) spreadContainer!: ElementRef<HTMLDivElement>;

    ngOnInit(): void {
        const WORKBOOK_DATA: Partial<IWorkbookData> = {}
        const univer = new Univer({
            locale: LocaleType.ZH_CN,
            locales: {
                [LocaleType.ZH_CN]: mergeLocales(
                    DesignZhCN,
                    UIZhCN,
                    DocsUIZhCN,
                    SheetsZhCN,
                    SheetsUIZhCN,
                    SheetsFormulaUIZhCN,
                    SheetsNumfmtUIZhCN,
                ),
            },
        })

        univer.registerPlugin(UniverRenderEnginePlugin)
        univer.registerPlugin(UniverFormulaEnginePlugin)

        univer.registerPlugin(UniverUIPlugin, {
            container: this.spreadContainer.nativeElement,
        })

        univer.registerPlugin(UniverDocsPlugin)
        univer.registerPlugin(UniverDocsUIPlugin)

        univer.registerPlugin(UniverSheetsPlugin)
        univer.registerPlugin(UniverSheetsUIPlugin)
        univer.registerPlugin(UniverSheetsFormulaUIPlugin)
        univer.registerPlugin(UniverSheetsNumfmtUIPlugin)

        univer.createUnit(UniverInstanceType.UNIVER_SHEET, WORKBOOK_DATA)

    }
}
