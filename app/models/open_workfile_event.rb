class OpenWorkfileEvent < ActiveRecord::Base
  belongs_to :user
  belongs_to :workfile

  attr_accessible :user, :workfile
  validates_presence_of :user, :workfile
end