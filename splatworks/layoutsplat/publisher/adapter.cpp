// SPDX-License-Identifier: GPL-3.0-only
// Browser adapter for libmspub: emit drawing events as validated JSON, never HTML.
#include <libmspub/libmspub.h>
#include <librevenge/librevenge.h>
#include <librevenge-stream/librevenge-stream.h>
#include <sstream>
#include <stdexcept>
#include <string>
#include <iostream>
#include <unicode/udata.h>
#include <iomanip>
#include <fstream>
#include <vector>
#ifdef __EMSCRIPTEN__
#include <emscripten.h>
#else
#define EMSCRIPTEN_KEEPALIVE
#endif
using namespace librevenge;
static std::string quoted(const char* value) {
  std::ostringstream out; out << '"';
  for (const unsigned char* p = reinterpret_cast<const unsigned char*>(value ? value : ""); *p; ++p) {
    if (*p == '"' || *p == '\\') out << '\\' << *p;
    else if (*p < 32) { const char* hex = "0123456789abcdef"; out << "\\u00" << hex[*p >> 4] << hex[*p & 15]; }
    else out << *p;
  }
  out << '"'; return out.str();
}
static std::string properties(const RVNGPropertyList& list, int depth=0) {
  if (depth > 12) throw std::runtime_error("Publisher properties are nested too deeply.");
  std::ostringstream out; out << '{'; bool first=true; RVNGPropertyList::Iter it(list);
  for (it.rewind(); it.next();) {
    if (!first) out << ','; first=false; out << quoted(it.key()) << ':';
    if (const auto* child = it.child()) {
      if (child->count() > 10000) throw std::runtime_error("Publisher path is too complex.");
      out << '['; for (unsigned long i=0; i<child->count(); ++i) { if (i) out << ','; out << properties((*child)[i], depth+1); } out << ']';
    } else out << "{\"value\":" << quoted(it()->getStr().cstr()) << ",\"number\":" << std::setprecision(16) << it()->getDouble() << ",\"unit\":" << it()->getUnit() << '}';
  }
  out << '}'; return out.str();
}
class Recorder : public RVNGDrawingInterface {
public:
  std::ostringstream events; unsigned long count=0;
  Recorder() { events << '['; }
  void record(const char* op, const std::string& data="{}") {
    if (++count > 100000 || events.tellp() > 64000000) throw std::runtime_error("Publisher document is too large.");
    if (count > 1) events << ','; events << "{\"op\":" << quoted(op) << ",\"data\":" << data << '}';
  }
  void startDocument(const RVNGPropertyList &propList) override { record("startDocument", properties(propList)); }
  void endDocument() override { record("endDocument"); }
  void setDocumentMetaData(const RVNGPropertyList &propList) override { record("setDocumentMetaData", properties(propList)); }
  void defineEmbeddedFont(const RVNGPropertyList &propList) override { record("defineEmbeddedFont"); }
  void startPage(const RVNGPropertyList &propList) override { record("startPage", properties(propList)); }
  void endPage() override { record("endPage"); }
  void startMasterPage(const RVNGPropertyList &propList) override { record("startMasterPage", properties(propList)); }
  void endMasterPage() override { record("endMasterPage"); }
  void setStyle(const RVNGPropertyList &propList) override { record("setStyle", properties(propList)); }
  void startLayer(const RVNGPropertyList &propList) override { record("startLayer", properties(propList)); }
  void endLayer() override { record("endLayer"); }
  void startEmbeddedGraphics(const RVNGPropertyList &propList) override { record("startEmbeddedGraphics", properties(propList)); }
  void endEmbeddedGraphics() override { record("endEmbeddedGraphics"); }
  void openGroup(const RVNGPropertyList &propList) override { record("openGroup", properties(propList)); }
  void closeGroup() override { record("closeGroup"); }
  void drawRectangle(const RVNGPropertyList &propList) override { record("drawRectangle", properties(propList)); }
  void drawEllipse(const RVNGPropertyList &propList) override { record("drawEllipse", properties(propList)); }
  void drawPolygon(const RVNGPropertyList &propList) override { record("drawPolygon", properties(propList)); }
  void drawPolyline(const RVNGPropertyList &propList) override { record("drawPolyline", properties(propList)); }
  void drawPath(const RVNGPropertyList &propList) override { record("drawPath", properties(propList)); }
  void drawGraphicObject(const RVNGPropertyList &propList) override { record("drawGraphicObject", properties(propList)); }
  void drawConnector(const RVNGPropertyList &propList) override { record("drawConnector", properties(propList)); }
  void startTextObject(const RVNGPropertyList &propList) override { record("startTextObject", properties(propList)); }
  void endTextObject() override { record("endTextObject"); }
  void startTableObject(const RVNGPropertyList &propList) override { record("startTableObject", properties(propList)); }
  void openTableRow(const RVNGPropertyList &propList) override { record("openTableRow", properties(propList)); }
  void closeTableRow() override { record("closeTableRow"); }
  void openTableCell(const RVNGPropertyList &propList) override { record("openTableCell", properties(propList)); }
  void closeTableCell() override { record("closeTableCell"); }
  void insertCoveredTableCell(const RVNGPropertyList &propList) override { record("insertCoveredTableCell", properties(propList)); }
  void endTableObject() override { record("endTableObject"); }
  void insertTab() override { record("insertTab"); }
  void insertSpace() override { record("insertSpace"); }
  void insertText(const RVNGString &text) override { record("insertText", quoted(text.cstr())); }
  void insertLineBreak() override { record("insertLineBreak"); }
  void insertField(const RVNGPropertyList &propList) override { record("insertField", properties(propList)); }
  void openOrderedListLevel(const RVNGPropertyList &propList) override { record("openOrderedListLevel", properties(propList)); }
  void openUnorderedListLevel(const RVNGPropertyList &propList) override { record("openUnorderedListLevel", properties(propList)); }
  void closeOrderedListLevel() override { record("closeOrderedListLevel"); }
  void closeUnorderedListLevel() override { record("closeUnorderedListLevel"); }
  void openListElement(const RVNGPropertyList &propList) override { record("openListElement", properties(propList)); }
  void closeListElement() override { record("closeListElement"); }
  void defineParagraphStyle(const RVNGPropertyList &propList) override { record("defineParagraphStyle", properties(propList)); }
  void openParagraph(const RVNGPropertyList &propList) override { record("openParagraph", properties(propList)); }
  void closeParagraph() override { record("closeParagraph"); }
  void defineCharacterStyle(const RVNGPropertyList &propList) override { record("defineCharacterStyle", properties(propList)); }
  void openSpan(const RVNGPropertyList &propList) override { record("openSpan", properties(propList)); }
  void closeSpan() override { record("closeSpan"); }
  void openLink(const RVNGPropertyList &propList) override { record("openLink", properties(propList)); }
  void closeLink() override { record("closeLink"); }
};
static std::string result;
static std::string encodingOverride;
extern "C" const char* layoutsplat_pub_encoding() { return encodingOverride.empty() ? nullptr : encodingOverride.c_str(); }
extern "C" EMSCRIPTEN_KEEPALIVE void set_pub_encoding(const char* encoding) { encodingOverride = encoding ? encoding : ""; }
extern "C" EMSCRIPTEN_KEEPALIVE int set_unicode_data(const void* data) {
  UErrorCode status = U_ZERO_ERROR; udata_setCommonData(data, &status); return status;
}
extern "C" EMSCRIPTEN_KEEPALIVE int load_unicode_data(const char* filename) {
  static std::vector<unsigned char> data; std::ifstream file(filename, std::ios::binary | std::ios::ate);
  const auto size = file.tellg(); if (!file || size <= 0 || size > 10000000) return 1;
  data.resize(static_cast<size_t>(size)); file.seekg(0); file.read(reinterpret_cast<char*>(data.data()), size);
  return file ? set_unicode_data(data.data()) : 1;
}
extern "C" EMSCRIPTEN_KEEPALIVE const char* parse_pub(const char* filename) {
  try {
    RVNGFileStream input(filename);
    if (!libmspub::MSPUBDocument::isSupported(&input)) throw std::runtime_error("This is not a supported native Publisher file.");
    Recorder recorder;
    if (!libmspub::MSPUBDocument::parse(&input,&recorder)) throw std::runtime_error("The native Publisher decoder could not read this document.");
    recorder.events << ']'; result = "{\"events\":" + recorder.events.str() + '}';
  } catch (const std::exception& error) { result="{\"error\":" + quoted(error.what()) + '}'; }
  catch (...) { result="{\"error\":\"Native Publisher decoding failed.\"}"; }
  return result.c_str();
}
#ifndef __EMSCRIPTEN__
int main(int argc, char** argv) { if (argc != 2) return 1; std::cout << parse_pub(argv[1]) << std::endl; }
#endif
