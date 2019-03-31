Feature: Start a chat

  Scenario Outline: Start a chat with a real friend
    Given a "<friend>"
    When a "<user>" start a "<chat>" with "<friend>"
    Then the "<chat>" is created "<message>"

  Examples:
    | user | friend | chat | message |
    | userTest3 | friendTest3 | chatUserTest3WithFriendTest3 | Chat created |
    | userTest3 | friend | chatUserTest3WithFriend | Friend does not exist |