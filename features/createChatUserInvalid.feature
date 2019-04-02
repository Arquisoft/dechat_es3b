Feature: Start a chat

  Scenario Outline: Start a chat with a real friend
    Given a "<user>" with a "<password>" that wants to talk with a friend
    Then the chat is created

  Examples:
    | user | password |
    | test3b | SolidTes |