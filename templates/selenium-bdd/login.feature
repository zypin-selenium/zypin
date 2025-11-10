Feature: Login Flow
  As a user
  I want to login to the application

  Scenario: Successful login
    Given I open browser "chrome"
    When I open "https://example.com"
    Then I should see "Example Domain"
    And I close browser
