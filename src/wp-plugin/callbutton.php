<?php
/**
 * Plugin Name: Call Button
 * Description: Beschreibung deines Plugins
 * Version: 1.0.0
 * Author: Dein Name
 */

// Funktion zum Erstellen der Einstellungsseite im Adminbereich
function call_button_settings_page() {
    add_options_page(
        'WP Call Button Einstellungen', // Titel der Seite
        'WP Call Button', // Titel im Menü
        'manage_options', // Berechtigung (Administrator)
        'call-button-settings', // Slug der Seite
        'call_button_settings_content' // Callback-Funktion für den Inhalt der Seite
    );
}
add_action('admin_menu', 'call_button_settings_page');

// Callback-Funktion für den Inhalt der Einstellungsseite
function call_button_settings_content() {
    ?>
    <div class="wrap">
        <h1>WP Call Button Einstellungen</h1>
        <form method="post" action="options.php">
            <?php
            settings_fields('call_button_settings_group'); // Name der Einstellungs-Gruppe
            do_settings_sections('call-button-settings'); // Slug der Seite
            submit_button(); // Speichern-Button
            ?>
        </form>
    </div>
    <?php
}

// Funktion zum Registrieren der Einstellungen
function call_button_settings_register() {
    register_setting('call_button_settings_group', 'call_button_settings'); // Name der Option in der Datenbank

    add_settings_section(
        'call_button_abschnitt', // ID des Abschnitts
        'Funktionsauswahl', // Titel des Abschnitts
        'call_button_abschnitt_beschreibung', // Callback-Funktion für die Beschreibung
        'call-button-settings' // Slug der Seite
    );

    add_settings_field(
        'funktion_a_aktivieren', // ID des Feldes
        'Funktion A', // Titel des Feldes
        'call_button_feld_funktion_a', // Callback-Funktion für das Feld
        'call-button-settings', // Slug der Seite
        'call_button_abschnitt' // ID des Abschnitts
    );

    // Weitere Felder für andere Funktionen hinzufügen...
}
add_action('admin_init', 'call_button_settings_register');

// Callback-Funktion für die Beschreibung des Abschnitts
function call_button_abschnitt_beschreibung() {
    echo 'Wähle die Funktionen aus, die du aktivieren möchtest.';
}

// Callback-Funktion für das Feld "Funktion A"
function call_button_feld_funktion_a() {
    $optionen = get_option('call_button_settings');
    $aktiviert = isset($optionen['funktion_a_aktivieren']) ? $optionen['funktion_a_aktivieren'] : 0;
    ?>
    <input type="checkbox" name="call_button_settings[funktion_a_aktivieren]" value="1" <?php checked($aktiviert, 1); ?> />
    <?php
}

// Callback-Funktionen für andere Felder hinzufügen...

// ... (Hier kommen die Funktionen deines Plugins hin) ...

?>