source 'https://rubygems.org'

gem 'rails', '3.2.18'

gem 'will_paginate'
gem 'net-ldap',      :require => false
gem 'paperclip', '3.0.4'
gem 'cocaine', '0.2.1' # cocaine is a paperclip dependency but new versions of cocaine cause trouble. remove this line after upgrading paperclip.
gem 'queue_classic', :github => 'Chorus/queue_classic'
gem 'clockwork',     :require => false
gem 'allowy'
gem 'sunspot_rails'
gem 'jetpack', :github => 'Chorus/jetpack', :branch => '6c9253195b+chorus', :require => false
gem 'nokogiri'
gem 'sequel', '~> 4.0', :require => 'sequel/no_core_ext'
gem 'attr_encrypted' #if you load attr_encrypted before sequel, it blows up saying 'sequel::model' is undefined
gem 'chorusgnip', :github => 'Chorus/gnip'
gem 'logger-syslog'
gem 'newrelic_rpm'
gem 'premailer-rails'
gem 'messengerjs-rails'
gem 'codemirror-rails', '3.23'
gem 'honor_codes', '~> 0.1.0'

platform :jruby do
  gem 'jruby-openssl', :require => false
  gem 'activerecord-jdbcpostgresql-adapter'
end

group :assets do
  gem 'sass-rails'
  gem 'compass-rails'
  gem 'handlebars_assets'
  gem 'therubyrhino'
  gem 'uglifier'
  gem 'yui-compressor'
  gem 'turbo-sprockets-rails3'

#jquery-rails 2.1.4 ==> jquery 1.8.3
gem 'jquery-rails', '2.1.4'

#jquery-rails 2.2.04 ==> jquery 1.9.0
#gem 'jquery-rails', '2.2.0'

#jquery-rails 3.1.1 ==> jquery 1.11.1
# updating to use jquery 1.11.1
# gem 'jquery-rails', '3.1.1'

  gem 'jquery-migrate-rails'
end

group :integration do
  gem 'capybara', "~> 2.0.0", :require => false
  gem 'headless'
  gem 'capybara-screenshot'
end

group :test, :integration, :packaging, :ci_jasmine, :ci_legacy, :ci_next do
  gem 'rr', :require => false
  gem 'fuubar'
  gem 'factory_girl'
  gem 'shoulda-matchers'
  gem 'rspec-rails'
  gem 'journey'
  gem 'timecop'
  gem 'hashie'
  gem 'vcr', '~> 2.3.0'
  gem 'fakefs',              :require => false
  gem 'chunky_png'
  gem 'database_cleaner',    :require => false
  gem 'poltergeist'
end

group :development, :test, :integration, :packaging, :ci_jasmine, :ci_legacy, :ci_next do
  gem 'foreman', '>= 0.62',      :require => false
  gem 'rake',                    :require => false
  gem 'rspec',                   :require => 'rspec/core/rake_task'
  gem 'jasmine', :github => 'pivotal/jasmine-gem'
  gem 'jasmine-core', :github => 'pivotal/jasmine'
  gem 'sunspot_matchers'
  gem 'fixture_builder'
  gem 'ci_reporter', '>= 1.8.2'
  gem 'faker'
  gem 'fakeweb'
  #gem 'sunspot_solr', :github => 'taktsoft/sunspot', :ref => '78717a33894271d012682dbe8902458badb0ca63' # https://github.com/sunspot/sunspot/pull/267
  gem 'sunspot_solr'
  gem 'backbone_fixtures_rails', :github => 'charleshansen/backbone_fixtures_rails'
  gem 'rspec_api_documentation', :github => 'Chorus/rspec_api_documentation', :require => false
end

group :development do
  gem 'license_finder', '~> 0.8.1', :require => false
  gem 'mizuno'
  gem 'bullet'
end
