library(readxl)
library(jsonlite)
library(tidyr)
library(dplyr)
library(stringr)
library(zoo)

cc_data_orig <- read_xlsx('Table-1-Headline-Jul-19.xlsx',
                     range = 'A4:M272')

cc_data <- cc_data_orig %>% 
  select(date_orig = 1, Total = 3, Male = 7, Female = 11) %>% 
  gather(gender, rate, -date_orig) %>% 
  mutate(date = str_c(str_extract(date_orig, '^\\d{4}'), ' ', str_extract(date_orig, '[:alpha:]{3}'))) %>% 
  mutate(rate = 0.01*rate) %>% 
  select(date, gender, rate)

write_json(cc_data, 'claimant_count.json')

#read_json('claimant_count.json')

