Feature: Make logout in the chat

  Scenario Outline: Do logout in chat
    Given a "<user>" and "<password>" and the user make login and log out
    Then the main window is shows

  Examples:
    | user | password |
    | test3b | SolidTest3b$ |