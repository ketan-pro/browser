import {
    Component,
    OnInit,
} from '@angular/core';

import { Angulartics2 } from 'angulartics2';

import { UriMatchType } from 'jslib/enums/uriMatchType';

import { I18nService } from 'jslib/abstractions/i18n.service';
import { MessagingService } from 'jslib/abstractions/messaging.service';
import { PlatformUtilsService } from 'jslib/abstractions/platformUtils.service';
import { StateService } from 'jslib/abstractions/state.service';
import { StorageService } from 'jslib/abstractions/storage.service';
import { TotpService } from 'jslib/abstractions/totp.service';

import { ConstantsService } from 'jslib/services/constants.service';

@Component({
    selector: 'app-options',
    templateUrl: 'options.component.html',
})
export class OptionsComponent implements OnInit {
    disableFavicon = false;
    enableAutoFillOnPageLoad = false;
    disableAutoTotpCopy = false;
    disableContextMenuItem = false;
    disableAddLoginNotification = false;
    disableChangedPasswordNotification = false;
    dontShowCards = false;
    dontShowIdentities = false;
    showDisableContextMenu = true;
    disableGa = false;
    theme: string;
    themeOptions: any[];
    defaultUriMatch = UriMatchType.Domain;
    uriMatchOptions: any[];

    constructor(private analytics: Angulartics2, private messagingService: MessagingService,
        private platformUtilsService: PlatformUtilsService, private storageService: StorageService,
        private stateService: StateService, private totpService: TotpService,
        i18nService: I18nService) {
        this.themeOptions = [
            { name: i18nService.t('default'), value: null },
            { name: i18nService.t('light'), value: 'light' },
            { name: i18nService.t('dark'), value: 'dark' },
        ];
        this.uriMatchOptions = [
            { name: i18nService.t('baseDomain'), value: UriMatchType.Domain },
            { name: i18nService.t('host'), value: UriMatchType.Host },
            { name: i18nService.t('startsWith'), value: UriMatchType.StartsWith },
            { name: i18nService.t('regEx'), value: UriMatchType.RegularExpression },
            { name: i18nService.t('exact'), value: UriMatchType.Exact },
            { name: i18nService.t('never'), value: UriMatchType.Never },
        ];
    }

    async ngOnInit() {
        this.showDisableContextMenu = !this.platformUtilsService.isSafari();

        this.enableAutoFillOnPageLoad = await this.storageService.get<boolean>(
            ConstantsService.enableAutoFillOnPageLoadKey);

        const disableGa = await this.storageService.get<boolean>(ConstantsService.disableGaKey);
        const disableGaByDefault = this.platformUtilsService.isFirefox();
        this.disableGa = disableGa || (disableGa == null && disableGaByDefault);

        this.disableAddLoginNotification = await this.storageService.get<boolean>(
            ConstantsService.disableAddLoginNotificationKey);

        this.disableChangedPasswordNotification = await this.storageService.get<boolean>(
            ConstantsService.disableChangedPasswordNotificationKey);

        this.disableContextMenuItem = await this.storageService.get<boolean>(
            ConstantsService.disableContextMenuItemKey);

        this.dontShowCards = await this.storageService.get<boolean>(ConstantsService.dontShowCardsCurrentTab);
        this.dontShowIdentities = await this.storageService.get<boolean>(ConstantsService.dontShowIdentitiesCurrentTab);

        this.disableAutoTotpCopy = !await this.totpService.isAutoCopyEnabled();

        this.disableFavicon = await this.storageService.get<boolean>(ConstantsService.disableFaviconKey);

        this.theme = await this.storageService.get<string>(ConstantsService.themeKey);

        const defaultUriMatch = await this.storageService.get<UriMatchType>(ConstantsService.defaultUriMatch);
        this.defaultUriMatch = defaultUriMatch == null ? UriMatchType.Domain : defaultUriMatch;
    }

    async saveGa() {
        if (this.disableGa) {
            this.callAnalytics('Analytics', !this.disableGa);
        }
        await this.storageService.save(ConstantsService.disableGaKey, this.disableGa);
        if (!this.disableGa) {
            this.callAnalytics('Analytics', !this.disableGa);
        }
    }

    async updateAddLoginNotification() {
        await this.storageService.save(ConstantsService.disableAddLoginNotificationKey,
            this.disableAddLoginNotification);
        this.callAnalytics('Add Login Notification', !this.disableAddLoginNotification);
    }

    async updateChangedPasswordNotification() {
        await this.storageService.save(ConstantsService.disableChangedPasswordNotificationKey,
            this.disableChangedPasswordNotification);
        this.callAnalytics('Changed Password Notification', !this.disableChangedPasswordNotification);
    }

    async updateDisableContextMenuItem() {
        await this.storageService.save(ConstantsService.disableContextMenuItemKey,
            this.disableContextMenuItem);
        this.messagingService.send('bgUpdateContextMenu');
        this.callAnalytics('Context Menu Item', !this.disableContextMenuItem);
    }

    async updateAutoTotpCopy() {
        await this.storageService.save(ConstantsService.disableAutoTotpCopyKey, this.disableAutoTotpCopy);
        this.callAnalytics('Auto Copy TOTP', !this.disableAutoTotpCopy);
    }

    async updateAutoFillOnPageLoad() {
        await this.storageService.save(ConstantsService.enableAutoFillOnPageLoadKey, this.enableAutoFillOnPageLoad);
        this.callAnalytics('Auto-fill Page Load', this.enableAutoFillOnPageLoad);
    }

    async updateDisableFavicon() {
        await this.storageService.save(ConstantsService.disableFaviconKey, this.disableFavicon);
        await this.stateService.save(ConstantsService.disableFaviconKey, this.disableFavicon);
        this.callAnalytics('Favicon', !this.disableFavicon);
    }

    async updateShowCards() {
        await this.storageService.save(ConstantsService.dontShowCardsCurrentTab, this.dontShowCards);
        await this.stateService.save(ConstantsService.dontShowCardsCurrentTab, this.dontShowCards);
        this.callAnalytics('Show Cards on Current Tab', !this.dontShowCards);
    }

    async updateShowIdentities() {
        await this.storageService.save(ConstantsService.dontShowIdentitiesCurrentTab, this.dontShowIdentities);
        await this.stateService.save(ConstantsService.dontShowIdentitiesCurrentTab, this.dontShowIdentities);
        this.callAnalytics('Show Identities on Current Tab', !this.dontShowIdentities);
    }

    async saveTheme() {
        await this.storageService.save(ConstantsService.themeKey, this.theme);
        this.analytics.eventTrack.next({ action: 'Set Theme ' + this.theme });
        window.setTimeout(() => window.location.reload(), 200);
    }

    async saveDefaultUriMatch() {
        await this.storageService.save(ConstantsService.defaultUriMatch, this.defaultUriMatch);
        this.analytics.eventTrack.next({ action: 'Set Default URI Match ' + this.defaultUriMatch });
    }

    private callAnalytics(name: string, enabled: boolean) {
        const status = enabled ? 'Enabled' : 'Disabled';
        this.analytics.eventTrack.next({ action: `${status} ${name}` });
    }
}
