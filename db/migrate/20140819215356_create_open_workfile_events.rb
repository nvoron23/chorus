class CreateOpenWorkfileEvents < ActiveRecord::Migration
  def change
    create_table :open_workfile_events do |t|
      t.references :user
      t.references :workfile

      t.timestamps
    end
  end
end
