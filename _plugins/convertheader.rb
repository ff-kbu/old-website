
# encoding: utf-8
require 'rubygems'
require 'nokogiri'
require 'iconv'

module Jekyll
  module ConvertHeader
    def convert_header(raw, mode)
      doc = Nokogiri::HTML.fragment(
        raw.encode(
          'UTF-8',
          :invalid => :replace,
          :undef => :replace,
          :replace => ''
        )
      )

      #don't look at me, i'm ugly

      i = 3
      while i > 0 do


        doc.css("h" + i.to_s).each do |entry|
          new_level = i + mode
          new_node = Nokogiri::HTML.fragment(
            '<h' + new_level.to_s + '>X</h' + new_level.to_s + '>'
          )
          new_node.first_element_child.inner_html = entry.inner_html
          entry.replace new_node
        end


        i = i - 1
      end


      doc.to_html
    end
  end
end

Liquid::Template.register_filter(Jekyll::ConvertHeader)
