library(readxl)
library(jsonlite)
library(tidyr)
library(dplyr)
library(stringr)
library(zoo)
library(rvest)

url <- "https://www.nisra.gov.uk/publications/claimant-count-tables"

page <- read_html(url)

xlsx_url <- page %>% 
  html_node(".nigovfile > a") %>% 
  html_attr("href")

curl::curl_download(xlsx_url, "claimant-count.xlsx")

cc_data_raw <- read_xlsx("claimant-count.xlsx", skip = 3)

cc_data <- cc_data_raw %>% 
  select(date_raw = 1, Total = 3, Male = 7, Female = 11) %>% 
  mutate(Total = as.double(Total)) %>% 
  pivot_longer(cols = -date_raw, names_to = "gender", values_to = "rate") %>% 
  filter_all(all_vars(!is.na(.))) %>% 
  mutate(
    date = str_c(str_extract(date_raw, '^\\d{4}'), ' ', str_extract(date_raw, '[:alpha:]{3}')),
    rate = 0.01 * rate
  ) %>% 
  select(date, gender, rate) %>% 
  filter_all(all_vars(!is.na(.)))

write_json(cc_data, 'claimant_count.json')

#read_json('claimant_count.json')

